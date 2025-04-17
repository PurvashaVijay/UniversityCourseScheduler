// src/components/admin/schedule/ScheduleTab.tsx
import React, { useState, useEffect } from 'react';
import { Box, SelectChangeEvent } from '@mui/material';
import ScheduleGenerator from './ScheduleGenerator';
import ScheduleList from './ScheduleList';
import ConflictManagement from './ConflictManagement';
import departmentService from '../../../services/departmentService';
import programService from '../../../services/programService';

interface Department {
department_id: string;
name: string;
}

interface Program {
program_id: string;
name: string;
department_id: string;
}

const ScheduleTab: React.FC = () => {
const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(undefined);
const [refreshCounter, setRefreshCounter] = useState<number>(0);
const [departments, setDepartments] = useState<Department[]>([]);
const [programs, setPrograms] = useState<Program[]>([]);
const [selectedDepartment, setSelectedDepartment] = useState<string>('');
const [selectedProgram, setSelectedProgram] = useState<string>('');
const [loadingDepartments, setLoadingDepartments] = useState<boolean>(true);
const [loadingPrograms, setLoadingPrograms] = useState<boolean>(false);

console.log("ScheduleTab rendering with selectedScheduleId:", selectedScheduleId);

// Fetch departments on component mount
useEffect(() => {
const fetchDepartments = async () => {
try {
setLoadingDepartments(true);
const data = await departmentService.getAllDepartments();
setDepartments(data);
} catch (error) {
console.error('Error fetching departments:', error);
} finally {
setLoadingDepartments(false);
}
};

fetchDepartments();
}, []);

// Fetch programs when department changes
useEffect(() => {
if (!selectedDepartment) {
setPrograms([]);
setSelectedProgram('');
return;
}

const fetchPrograms = async () => {
try {
setLoadingPrograms(true);
const data = await programService.getProgramsByDepartment(selectedDepartment);
setPrograms(data);
} catch (error) {
console.error('Error fetching programs:', error);
} finally {
setLoadingPrograms(false);
}
};

fetchPrograms();
}, [selectedDepartment]);

const handleDepartmentChange = (event: SelectChangeEvent) => {
setSelectedDepartment(event.target.value);
setSelectedProgram(''); // Reset program selection when department changes
};

const handleProgramChange = (event: SelectChangeEvent) => {
setSelectedProgram(event.target.value);
};

const handleScheduleGenerated = (scheduleId: string) => {
console.log("Schedule generated with ID:", scheduleId);
// Update selectedScheduleId when a new schedule is generated
setSelectedScheduleId(scheduleId);
// Force refresh the schedule list
setRefreshCounter(prev => prev + 1);
};

const handleScheduleSelected = (scheduleId: string) => {
console.log("Schedule selected with ID:", scheduleId);
// Update the selected schedule when user selects from the list
setSelectedScheduleId(scheduleId);
};

const handleConflictResolved = () => {
console.log("Conflict resolved, refreshing data");
// Refresh schedule list when a conflict is resolved
// (we keep the same selectedScheduleId)
setRefreshCounter(prev => prev + 1);
};

const handleScheduleDeleted = () => {
console.log("Schedule deleted, clearing selection");
// When a schedule is deleted, clear the selected schedule ID
setSelectedScheduleId(undefined);
// Force refresh the schedule list
setRefreshCounter(prev => prev + 1);
};

return (
<Box>
<ScheduleGenerator onScheduleGenerated={handleScheduleGenerated} />
<ScheduleList
selectedScheduleId={selectedScheduleId}
forceRefresh={refreshCounter}
onScheduleDeleted={handleScheduleDeleted}
onScheduleSelected={handleScheduleSelected}
departments={departments}
programs={programs}
selectedDepartment={selectedDepartment}
selectedProgram={selectedProgram}
loadingDepartments={loadingDepartments}
loadingPrograms={loadingPrograms}
onDepartmentChange={handleDepartmentChange}
onProgramChange={handleProgramChange}
/>
<ConflictManagement
scheduleId={selectedScheduleId}
onConflictResolved={handleConflictResolved}
/>
</Box>
);
};

export default ScheduleTab;