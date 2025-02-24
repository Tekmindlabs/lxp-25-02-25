import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Status } from "@prisma/client";
import { SubjectSyncService } from '@/server/services/SubjectSyncService';

export const subjectRouter = createTRPCRouter({
	getSubjectsByClassId: protectedProcedure
		.input(z.object({
			classId: z.string()
		}))
		.query(async ({ ctx, input }) => {
			const assignments = await ctx.prisma.teacherAssignment.findMany({
				where: { classId: input.classId },
				include: {
					subject: {
						include: {
							teachers: {
								include: {
									teacher: {
										include: {
											user: true
										}
									}
								}
							}
						}
					}
				}
			});

			return assignments.map(a => a.subject);
		}),


	getAll: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.subject.findMany({
				include: {
					classGroups: true,
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	create: protectedProcedure
		.input(z.object({
			name: z.string(),
			code: z.string(),
			description: z.string().optional(),
			classGroupIds: z.array(z.string()),
			teacherIds: z.array(z.string()).optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
		}))

		.mutation(async ({ ctx, input }) => {
			const { classGroupIds, teacherIds, ...subjectData } = input;
			const subjectSyncService = new SubjectSyncService(ctx.prisma);
			
			const subject = await ctx.prisma.subject.create({
				data: {
					...subjectData,
					...(classGroupIds && {
						classGroups: {
							connect: classGroupIds.map(id => ({ id })),
						},
					}),
				},
				include: {
					classGroups: true,
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
				},
			});

			// Track changes and sync with classes
			await Promise.all(classGroupIds.map(async (classGroupId) => {
				await subjectSyncService.trackSubjectChanges(classGroupId, {
					type: 'CREATE',
					subjectId: subject.id,
				});
				await subjectSyncService.syncClassSubjects(classGroupId);
			}));

			if (teacherIds && teacherIds.length > 0) {
				await ctx.prisma.teacherSubject.createMany({
					data: teacherIds.map(teacherId => ({
						subjectId: subject.id,
						teacherId,
						status: Status.ACTIVE,
					})),
				});
			}

			return subject;
		}),

	update: protectedProcedure
		.input(z.object({
			id: z.string(),
			name: z.string().optional(),
			code: z.string().optional(),
			description: z.string().optional(),


			classGroupIds: z.array(z.string()),
			teacherIds: z.array(z.string()).optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, classGroupIds, teacherIds, ...data } = input;
			const subjectSyncService = new SubjectSyncService(ctx.prisma);

			const subject = await ctx.prisma.subject.update({
				where: { id },
				data: {
					...data,
					...(classGroupIds && {
						classGroups: {
							set: classGroupIds.map(id => ({ id })),
						},
					}),
				},
				include: {
					classGroups: true,
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
				},
			});

			// Track changes and sync with classes
			await Promise.all(classGroupIds.map(async (classGroupId) => {
				await subjectSyncService.trackSubjectChanges(classGroupId, {
					type: 'UPDATE',
					subjectId: subject.id,
				});
				await subjectSyncService.syncClassSubjects(classGroupId);
			}));

			if (teacherIds) {
				await ctx.prisma.teacherSubject.deleteMany({
					where: { subjectId: id },
				});

				if (teacherIds.length > 0) {
					await ctx.prisma.teacherSubject.createMany({
						data: teacherIds.map(teacherId => ({
							subjectId: id,
							teacherId,
							status: Status.ACTIVE,
						})),
					});
				}
			}

			return subject;
		}),

	deleteSubject: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.subject.delete({
				where: { id: input },
			});
		}),

	getById: protectedProcedure
		.input(z.string())
		.query(async ({ ctx, input }) => {
			return ctx.prisma.subject.findUnique({
				where: { id: input },
				include: {
					classGroups: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
					periods: {
						include: {
							timetable: true,
							classroom: true,
						},
					},
				},
			});
		}),

	searchSubjects: protectedProcedure
		.input(z.object({
			classGroupIds: z.array(z.string()).optional(),
			teacherIds: z.array(z.string()).optional(),
			search: z.string().optional(),
			status: z.enum([Status.ACTIVE, Status.INACTIVE, Status.ARCHIVED]).optional(),
		}))
		.query(async ({ ctx, input }) => {
			const { search, classGroupIds, teacherIds, status } = input;


			return ctx.prisma.subject.findMany({
				where: {
					...(search && {
						OR: [
							{ name: { contains: search, mode: 'insensitive' } },
							{ code: { contains: search, mode: 'insensitive' } },
							{ description: { contains: search, mode: 'insensitive' } },
						],
					}),
					...(classGroupIds && classGroupIds.length > 0 && {
						classGroups: {
							some: { id: { in: classGroupIds } },
						},
					}),
					...(status && { status }),
					...(teacherIds && teacherIds.length > 0 && {
						teachers: {
							some: { teacherId: { in: teacherIds } },
						},
					}),

				},
				include: {
					classGroups: {
						include: {
							program: true,
						},
					},
					teachers: {
						include: {
							teacher: {
								include: {
									user: true,
								},
							},
						},
					},
				},
				orderBy: {
					name: 'asc',
				},
			});
		}),

	getAvailableTeachers: protectedProcedure
		.query(async ({ ctx }) => {
			return ctx.prisma.teacherProfile.findMany({
				where: {
					user: {
						status: Status.ACTIVE,
					},
				},
				include: {
					user: true,
					subjects: true,
				},
			});
		}),

	list: protectedProcedure
		.query(({ ctx }) => {
			return ctx.prisma.subject.findMany({
				include: {
					teachers: {
						include: {
							teacher: true,
						},
					},
					periods: {
						include: {
							timetable: {
								include: {
									classGroup: true,
									class: true,
								},
							},
							classroom: true,
						},
					},
					classGroups: true,
				},
			});
		}),
});