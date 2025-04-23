// src/components/admin/schedule/ScheduleTab.tsx

import React, { useState, useEffect } from 'react';
import { Box, SelectChangeEvent } from '@mui/material';
import ScheduleGenerator from './ScheduleGenerator';
import ScheduleList from './ScheduleList';
import ConflictManagement from './ConflictManagement';
import programService from '../../../services/programService';

interface Program {
  program_id: string;
  name: string;
}

const ScheduleTab: React.FC = () => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(undefined);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState<boolean>(true);

  console.log("ScheduleTab rendering with selectedScheduleId:", selectedScheduleId);

  // Fetch all programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        
        // Get all programs instead of filtering by department
        const data = await programService.getAllPrograms();
        setPrograms(data);
      } catch (error) {
        console.error('Error fetching programs:', error);
      } finally {
        setLoadingPrograms(false);
      }
    };

    fetchPrograms();
  }, []);

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
        programs={programs}
        selectedProgram={selectedProgram}
        loadingPrograms={loadingPrograms}
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