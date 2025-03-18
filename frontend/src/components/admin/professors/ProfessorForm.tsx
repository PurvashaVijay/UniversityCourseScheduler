// ProfessorForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import { Professor } from '../../../services/professorService';
import { Department } from '../../../services/departmentService';
import { SelectChangeEvent } from '@mui/material/Select';

interface ProfessorFormProps {
  open: boolean;
  professor: Professor | null;
  departments: Department[];
  onClose: () => void;
  onSave: (professor: Professor) => void;
}

const ProfessorForm: React.FC<ProfessorFormProps> = ({
  open,
  professor,
  departments,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Professor>({
    professor_id: '',
    department_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password_hash: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (professor) {
      setFormData({
        ...professor,
        password_hash: '' // Don't show the actual hash
      });
    } else {
      // For new professors, reset the form
      setFormData({
        professor_id: '',
        department_id: departments.length > 0 ? departments[0].department_id : '',
        first_name: '',
        last_name: '',
        email: '',
        password_hash: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    setPassword('');
    setErrors({});
  }, [professor, departments]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev: Professor) => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error for this field when user types
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.department_id) {
      newErrors.department_id = 'Department is required';
    }
    
    // Password is required only for new professors
    if (!professor && !password) {
      newErrors.password = 'Password is required for new professors';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const professorData: Professor = {
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      if (password) {
        // For simplicity, we're just using the password directly here
        // In a real implementation, the backend would hash this
        professorData.password_hash = password;
      }
      
      onSave(professorData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {professor ? 'Edit Professor' : 'Add New Professor'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              name="first_name"
              label="First Name"
              fullWidth
              value={formData.first_name}
              onChange={handleChange}
              error={!!errors.first_name}
              helperText={errors.first_name}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="last_name"
              label="Last Name"
              fullWidth
              value={formData.last_name}
              onChange={handleChange}
              error={!!errors.last_name}
              helperText={errors.last_name}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.department_id}>
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                label="Department"
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.department_id && (
                <FormHelperText>{errors.department_id}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="password"
              label={professor ? "New Password (leave blank to keep current)" : "Password"}
              type="password"
              fullWidth
              value={password}
              onChange={handlePasswordChange}
              error={!!errors.password}
              helperText={errors.password}
              required={!professor}
            />
          </Grid>
          {professor && (
            <Grid item xs={12}>
              <TextField
                name="professor_id"
                label="Professor ID"
                fullWidth
                value={formData.professor_id}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfessorForm;

