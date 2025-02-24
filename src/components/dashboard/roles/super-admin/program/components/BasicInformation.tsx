import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Status } from "@prisma/client";
import { Calendar, Campus, Coordinator, ProgramFormData } from "@/types/program";
import { api } from "@/utils/api";

interface BasicInformationProps {
	formData: ProgramFormData;
	calendars: Calendar[];
	coordinators: Coordinator[];
	campuses: Campus[];
	onFormDataChange: (data: Partial<ProgramFormData>) => void;
}

export const BasicInformation = ({
	formData,
	calendars,
	coordinators,
	campuses,
	onFormDataChange
}: BasicInformationProps) => {
	return (
		<div className="space-y-4">
			<div>
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					value={formData.name}
					onChange={(e) => onFormDataChange({ name: e.target.value })}
					required
				/>
			</div>

			<div>
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					value={formData.description}
					onChange={(e) => onFormDataChange({ description: e.target.value })}
				/>
			</div>

			<div>
				<Label htmlFor="calendar">Calendar</Label>
				<Select
					value={formData.calendarId}
					onValueChange={(value) => onFormDataChange({ calendarId: value })}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select Calendar" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="NO_SELECTION">Select Calendar</SelectItem>
						{calendars?.map((calendar) => (
							<SelectItem key={calendar.id} value={calendar.id}>
								{calendar.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor="coordinator">Coordinator</Label>
				<Select
					value={formData.coordinatorId || ""}
					onValueChange={(value) => onFormDataChange({ coordinatorId: value || undefined })}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select Coordinator" />
					</SelectTrigger>
					<SelectContent>
						{coordinators.map((coordinator) => (
							<SelectItem key={coordinator.id} value={coordinator.id}>
								{coordinator.user.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label htmlFor="campus">Campus</Label>
				<div className="w-full">
					<MultiSelect
						options={campuses.map(campus => ({
							value: campus.id,
							label: campus.name
						}))}
						value={formData.campusId}
						onChange={(selected) => onFormDataChange({ campusId: selected })}
						placeholder="Select Campuses"
					/>
				</div>
			</div>

			<div>
				<Label htmlFor="status">Status</Label>
				<Select
					value={formData.status}
					onValueChange={(value) => onFormDataChange({ status: value as Status })}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select Status" />
					</SelectTrigger>
					<SelectContent>
						{Object.values(Status).map((status) => (
							<SelectItem key={status} value={status}>
								{status}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};
