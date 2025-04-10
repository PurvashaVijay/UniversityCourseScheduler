// src/components/admin/schedule/ScheduleTab.tsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ScheduleGenerator from './ScheduleGenerator';
import ScheduleList from './ScheduleList';
import ConflictManagement from './ConflictManagement';

const ScheduleTab: React.FC = () => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(undefined);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  console.log("ScheduleTab rendering with selectedScheduleId:", selectedScheduleId);

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
      />
      <ConflictManagement
        scheduleId={selectedScheduleId}
        onConflictResolved={handleConflictResolved}
      />
    </Box>
  );
};

export default ScheduleTab;