// src/components/admin/departments/DepartmentList.tsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Paper, 
  Snackbar, 
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../common/DataTable';
import ConfirmDialog from '../../common/ConfirmDialog';

// This would come from your actual departmentService
const fetchDepartments = async () => {
  // Mock data for demonstration
  return [
    { id: 'DEPT-001', department_id: 'DEPT-001', name: 'Computer Science', description: 'CS Department' },
    { id: 'DEPT-002', department_id: 'DEPT-002', name: 'Economics', description: 'Economics Department' },
    { id: 'DEPT-003', department_id: 'DEPT-003', name: 'Mathematics', description: 'Mathematics Department' },
    { id: 'DEPT-004', department_id: 'DEPT-004', name: 'Physics', description: 'Physics Department' },
    { id: 'DEPT-005', department_id: 'DEPT-005', name: 'Business Administration', description: 'Business Administration Department' },
  ];
};

// Mock delete function
const deleteDepartments = async (ids: string[]) => {
  console.log('Deleting departments:', ids);
  return { success: true, message: 'Departments deleted successfully' };
};

const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [departmentsToDelete, setDepartmentsToDelete] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const columns = [
    { id: 'department_id', label: 'ID', minWidth: 100 },
    { id: 'name', label: 'Name', minWidth: 170 },
    { id: 'description', label: 'Description', minWidth: 200 },
  ];

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const data = await fetchDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load departments',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  const handleAddDepartment = () => {
    navigate('/admin/departments/new');
  };

  const handleEditDepartment = (id: string) => {
    navigate(`/admin/departments/${id}/edit`);
  };

  const handleDeleteClick = (ids: string | string[]) => {
    // Convert to array if it's a single string
    const idsArray = Array.isArray(ids) ? ids : [ids];
    setDepartmentsToDelete(idsArray);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteDepartments(departmentsToDelete);
      
      if (result.success) {
        // Remove deleted departments from state
        setDepartments(departments.filter(
          dept => !departmentsToDelete.includes(dept.id)
        ));
        
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to delete departments',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting departments:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete departments',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDepartmentsToDelete([]);
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/admin/departments/${id}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Departments
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddDepartment}
          sx={{ bgcolor: '#00539F' }}
        >
          Add Department
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={departments}
          title="Departments"
          onEdit={handleEditDepartment}
          onDelete={handleDeleteClick}
          onRowClick={handleRowClick}
          selectable
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Department"
        message={`Are you sure you want to delete ${departmentsToDelete.length > 1 
          ? 'these departments' 
          : 'this department'}? This action cannot be undone.`}
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

export default DepartmentList;
