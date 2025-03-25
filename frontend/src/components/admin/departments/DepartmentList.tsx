// src/components/admin/departments/DepartmentList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Snackbar, 
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../components/common/DataTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import departmentService, { DepartmentDetail } from '../../../services/departmentService';

const DepartmentList: React.FC = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<DepartmentDetail[]>([]);
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
        console.log('Loading all departments');
        const data = await departmentService.getAllDepartments();
        console.log('Departments loaded successfully:', data);
        setDepartments(data);
      } catch (error) {
        console.error('Error loading departments:', error);
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : 'Failed to load departments',
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
    console.log(`Navigating to edit department with ID: ${id}`);
    navigate(`/admin/departments/${id}/edit`);
  };

/*
  const handleDeleteClick = (ids: string | string[]) => {
    // Convert to array if it's a single string
    const idsArray = Array.isArray(ids) ? ids : [ids];
    console.log('Preparing to delete departments:', idsArray);
    setDepartmentsToDelete(idsArray);
    setDeleteDialogOpen(true);
  };
*/

  const handleDeleteClick = (ids: string | string[]) => {
    // Convert to array if it's a single string
    const idsArray = Array.isArray(ids) ? ids : [ids];
    console.log('Preparing to delete departments with IDs:', idsArray);
     // Verify that IDs are valid
    if (idsArray.length === 0 || idsArray.some(id => !id)) {
      console.error('Invalid department ID detected:', idsArray);
      setSnackbar({
        open: true,
        message: 'Error: Invalid department ID',
        severity: 'error'
      });
      return;
    }
    setDepartmentsToDelete(idsArray);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      console.log('Attempting to delete departments:', departmentsToDelete);
      
      if (departmentsToDelete.length > 1) {
        // Use batch delete if available
        console.log('Using batch delete for multiple departments');
        await departmentService.deleteDepartments(departmentsToDelete);
      } else {
        // Delete one by one
        for (const id of departmentsToDelete) {
          console.log(`Deleting single department with ID: ${id}`);
          await departmentService.deleteDepartment(id);
        }
      }
      
      // Remove deleted departments from state
      setDepartments(prev => prev.filter(
        dept => !departmentsToDelete.includes(dept.department_id)
      ));
      
      setSnackbar({
        open: true,
        message: 'Departments deleted successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error details during deletion:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete departments',
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