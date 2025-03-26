// src/components/admin/programs/ProgramList.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import programService from '../../../services/programService';
import departmentService from '../../../services/departmentService';

const ProgramList: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programsToDelete, setProgramsToDelete] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const columns = [
    { id: 'program_id', label: 'ID', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'description', label: 'Description', minWidth: 200 },
  ];

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load departments',
          severity: 'error'
        });
      }
    };

    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadPrograms(selectedDepartment);
    } else {
      setPrograms([]);
    }
  }, [selectedDepartment]);

  const loadPrograms = async (departmentId: string) => {
    try {
      setLoading(true);
      const data = await programService.getProgramsByDepartment(departmentId);
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load programs',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (event: SelectChangeEvent) => {
    setSelectedDepartment(event.target.value);
  };

  const handleAddProgram = () => {
    if (selectedDepartment) {
      navigate(`/admin/programs/new?departmentId=${selectedDepartment}`);
    } else {
      setSnackbar({
        open: true,
        message: 'Please select a department first',
        severity: 'error'
      });
    }
  };

  const handleEditProgram = (id: string) => {
    console.log("Edit clicked with ID:", id); // Add this debug line
    navigate(`/admin/programs/${id}/edit`);
  };

  const handleDeleteClick = (ids: string | string[]) => {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    console.log("Delete clicked with IDs:", idsArray); // Add this debug line
    setProgramsToDelete(idsArray);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (programsToDelete.length > 1) {
        // Use batch delete if multiple programs
        await programService.deletePrograms(programsToDelete);
      } else {
        // Delete one by one
        for (const id of programsToDelete) {
          await programService.deleteProgram(id);
        }
      }
      
      // Remove deleted programs from state
      setPrograms(prev => prev.filter(
        prog => !programsToDelete.includes(prog.program_id)
      ));
      
      setSnackbar({
        open: true,
        message: 'Programs deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting programs:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete programs',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setProgramsToDelete([]);
    }
  };

  const handleRowClick = (id: string) => {
    console.log("Row clicked with ID:", id); // Add this debug line
    navigate(`/admin/programs/${id}`);
  };

  // Filter programs based on search term
  const filteredPrograms = programs.filter(program => 
    program.program_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (program.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Programs
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddProgram}
          sx={{ bgcolor: '#00539F' }}
          disabled={!selectedDepartment}
        >
          Add Program
        </Button>
      </Box>

      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="department-select-label">Select Department</InputLabel>
          <Select
            labelId="department-select-label"
            id="department-select"
            value={selectedDepartment}
            label="Select Department"
            onChange={handleDepartmentChange}
          >
            <MenuItem value="">
              <em>Please select a department</em>
            </MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.department_id} value={dept.department_id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search programs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {!selectedDepartment ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Please select a department to view programs
              </Typography>
            </Box>
          ) : filteredPrograms.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No programs found for this department
              </Typography>
            </Box>
          ) : (
            <DataTable
              columns={columns}
              data={filteredPrograms}
              title={`Programs - ${departments.find(d => d.department_id === selectedDepartment)?.name || ''}`}
              onEdit={handleEditProgram}
              onDelete={handleDeleteClick}
              onRowClick={handleRowClick}
              selectable
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Program"
        message={`Are you sure you want to delete ${programsToDelete.length > 1 
          ? 'these programs' 
          : 'this program'}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmText="Delete"
        severity="error"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgramList;