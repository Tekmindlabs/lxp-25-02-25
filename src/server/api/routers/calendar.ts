import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { CalendarType, Status, Visibility } from "@prisma/client";
import type { CalendarEvent } from "@/types/calendar";
import { TermManagementService } from "../../services/TermManagementService";
import { CalendarInheritanceService, CalendarInheritanceError } from "../../services/CalendarInheritanceService";

const transformEventData = (input: any): Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> => {
	const { inheritanceSettings, ...rest } = input;
	return {
		title: rest.title,
		description: rest.description || undefined,
		startDate: rest.startDate,
		endDate: rest.endDate,
		level: rest.level,
		calendarId: rest.calendarId,
		programId: rest.programId || undefined,
		classGroupId: rest.classGroupId || undefined,
		classId: rest.classId || undefined,
		status: rest.status,
		inheritanceSettings: rest.inheritanceSettings
	};
};

const calendarSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	startDate: z.date(),
	endDate: z.date(),
	type: z.nativeEnum(CalendarType),
	visibility: z.nativeEnum(Visibility).optional().default(Visibility.ALL),
	isDefault: z.boolean().optional(),
	status: z.nativeEnum(Status).optional(),
	academicYearId: z.string().optional(),
});

export const calendarRouter = createTRPCRouter({
	getAll: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.calendar.findMany({
			select: {
				id: true,
				name: true,
				description: true,
				startDate: true,
				endDate: true,
				type: true,
				status: true,
				isDefault: true,
				visibility: true,
				metadata: true,
				events: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}),

	getCalendarById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const calendar = await ctx.prisma.calendar.findUnique({
				where: { id: input.id },
				include: {
					events: true,
					programs: true,
					terms: true,
				},
			});

			if (!calendar) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Calendar not found',
				});
			}

			return calendar;
		}),

	createCalendar: protectedProcedure
		.input(calendarSchema)
		.mutation(async ({ ctx, input }) => {
			// If this calendar is set as default, unset any existing default calendar
			if (input.isDefault) {
				await ctx.prisma.calendar.updateMany({
					where: { isDefault: true },
					data: { isDefault: false },
				});
			}

			const { academicYearId, ...restInput } = input;
			return ctx.prisma.calendar.create({
				data: {
					...restInput,
					status: input.status || Status.ACTIVE,
					...(academicYearId && {
						academicYear: {
							connect: { id: academicYearId }
						}
					})
				},
			});
		}),

	updateCalendar: protectedProcedure
		.input(z.object({
			id: z.string(),
			data: calendarSchema.partial(),
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, data } = input;

			// If this calendar is being set as default, unset any existing default calendar
			if (data.isDefault) {
				await ctx.prisma.calendar.updateMany({
					where: { 
						isDefault: true,
						id: { not: id },
					},
					data: { isDefault: false },
				});
			}

			return ctx.prisma.calendar.update({
				where: { id },
				data,
			});
		}),

	deleteCalendar: protectedProcedure
		.input(z.string())
		.mutation(async ({ ctx, input }) => {
			const calendar = await ctx.prisma.calendar.findUnique({
				where: { id: input },
				include: {
					events: true,
					programs: true,
				},
			});

			if (!calendar) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Calendar not found',
				});
			}

			if (calendar.isDefault) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot delete default calendar',
				});
			}

			if (calendar.programs.length > 0) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot delete calendar with associated programs',
				});
			}

			// Delete all events first
			await ctx.prisma.event.deleteMany({
				where: { calendarId: input },
			});

			// Then delete the calendar
			return ctx.prisma.calendar.delete({
				where: { id: input },
			});
		}),

	getEventsByDateRange: protectedProcedure
		.input(z.object({
			startDate: z.date(),
			endDate: z.date(),
			level: z.string(),
			entityId: z.string().nullable(),
		}))
		.query(async ({ ctx, input }) => {
			const where: any = {
				startDate: { gte: input.startDate },
				endDate: { lte: input.endDate },
				level: input.level,
			};

			if (input.entityId) {
				where[`${input.level.toLowerCase()}Id`] = input.entityId;
			}

			return ctx.prisma.calendarEvent.findMany({ where });
		}),

	getEntitiesByLevel: protectedProcedure
		.input(z.object({
			level: z.string(),
		}))
		.query(async ({ ctx, input }) => {
			switch (input.level) {
				case 'PROGRAM':
					return ctx.prisma.program.findMany();
				case 'CLASS_GROUP':
					return ctx.prisma.classGroup.findMany();
				case 'CLASS':
					return ctx.prisma.class.findMany();
				default:
					return [];
			}
		}),

	createEvent: protectedProcedure
		.input(z.object({
			title: z.string(),
			description: z.string().optional().nullable(),
			startDate: z.date(),
			endDate: z.date(),
			level: z.enum(['class', 'class_group']),
			calendarId: z.string(),
			classId: z.string().optional().nullable(),
			classGroupId: z.string().optional().nullable(),
			status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
			inheritanceSettings: z.object({
				propagateToChildren: z.boolean(),
				overrideParentSettings: z.boolean()
			}).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const inheritanceService = new CalendarInheritanceService(ctx.prisma);

			try {
				if (input.level === 'class_group' && input.classGroupId) {
					const classGroup = await ctx.prisma.classGroup.findUnique({
						where: { id: input.classGroupId },
						include: { program: true }
					});

					if (classGroup) {
						await inheritanceService.validateInheritanceChain({
							program: classGroup.programId,
							classGroup: input.classGroupId
						});
					}
				}

				const event = (await ctx.prisma.calendarEvent.create({
					data: {
						...transformEventData(input),
						...(input.inheritanceSettings && {
							metadata: { inheritanceSettings: input.inheritanceSettings }
						})
					}
				})) as unknown as CalendarEvent;

				if (input.inheritanceSettings?.propagateToChildren && 
					input.level === 'class_group' && 
					input.classGroupId) {
					await inheritanceService.propagateEventToChildren(event as CalendarEvent, input.classGroupId);
				}

				return event;
			} catch (error) {
				if (error instanceof CalendarInheritanceError) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: error.message,
						cause: error
					});
				}
				throw error;
			}
		}),

	getEvents: protectedProcedure
		.input(z.object({
			entityId: z.string(),
			entityType: z.enum(['class', 'class_group'])
		}))
		.query(async ({ ctx, input }) => {
			return ctx.prisma.calendarEvent.findMany({
				where: {
					[input.entityType === 'class' ? 'classId' : 'classGroupId']: input.entityId,
					status: 'ACTIVE'
				},
				orderBy: { startDate: 'asc' }
			});
		}),

	updateEvent: protectedProcedure
		.input(z.object({
			id: z.string(),
			title: z.string().optional(),
			description: z.string().optional(),
			startDate: z.date().optional(),
			endDate: z.date().optional(),
			status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
		}))
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.calendarEvent.update({
				where: { id },
				data
			});
		}),

	deleteEvent: protectedProcedure
		.input(z.object({
			eventId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.calendarEvent.delete({
				where: { id: input.eventId }
			});
		}),

	initializeClassGroupCalendar: protectedProcedure
		.input(z.object({
			classGroupId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const termService = new TermManagementService(ctx.prisma);
			return termService.createClassGroupCalendar(input.classGroupId);
		}),

	initializeClassCalendar: protectedProcedure
		.input(z.object({
			classId: z.string()
		}))
		.mutation(async ({ ctx, input }) => {
			const termService = new TermManagementService(ctx.prisma);
			return termService.createClassCalendar(input.classId);
		})
});