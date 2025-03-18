// src/components/common/FormComponents.tsx

import React from 'react';
import { 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  Checkbox,
  ListItemText
} from '@mui/material';

// Text Field with validation
interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  fullWidth = true,
  type = 'text',
  multiline = false,
  rows = 1,
  disabled = false,
}) => {
  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error}
      required={required}
      fullWidth={fullWidth}
      type={type}
      variant="outlined"
      margin="normal"
      multiline={multiline}
      rows={rows}
      disabled={disabled}
    />
  );
};

// Select with validation
interface SelectInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: SelectChangeEvent<string>) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  fullWidth = true,
}) => {
  return (
    <FormControl 
      error={!!error} 
      required={required} 
      fullWidth={fullWidth} 
      margin="normal"
    >
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        onChange={onChange}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

// Switch Toggle
interface SwitchInputProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const SwitchInput: React.FC<SwitchInputProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          color="primary"
        />
      }
      label={label}
    />
  );
};

// Multiple Select with Chips
interface MultiSelectProps {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  required = false,
  fullWidth = true,
}) => {
  const handleChange = (event: SelectChangeEvent<typeof value>) => {
    const {
      target: { value: newValue },
    } = event;
    onChange(typeof newValue === 'string' ? newValue.split(',') : newValue);
  };

  return (
    <FormControl 
      error={!!error} 
      required={required} 
      fullWidth={fullWidth} 
      margin="normal"
    >
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        multiple
        value={value}
        onChange={handleChange}
        input={<OutlinedInput id={`${id}-select`} label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((val) => {
              const option = options.find(opt => opt.value === val);
              return (
                <Chip key={val} label={option ? option.label : val} />
              );
            })}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Checkbox checked={value.indexOf(option.value) > -1} />
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

// Section Divider
interface SectionDividerProps {
  title: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ title }) => {
  return (
    <Box sx={{// src/components/common/FormComponents.tsx (continued)
        my: 3,
        py: 1,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Typography variant="h6" color="primary">
          {title}
        </Typography>
      </Box>
    );
  };
  
  // Number Input
  interface NumberInputProps {
    id: string;
    label: string;
    value: number | '';
    onChange: (value: number | '') => void;
    error?: string;
    required?: boolean;
    fullWidth?: boolean;
    min?: number;
    max?: number;
    step?: number;
  }
  
  export const NumberInput: React.FC<NumberInputProps> = ({
    id,
    label,
    value,
    onChange,
    error,
    required = false,
    fullWidth = true,
    min,
    max,
    step = 1,
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value === '' ? '' : Number(e.target.value);
      onChange(newValue);
    };
  
    return (
      <TextField
        id={id}
        label={label}
        value={value}
        onChange={handleChange}
        error={!!error}
        helperText={error}
        required={required}
        fullWidth={fullWidth}
        type="number"
        variant="outlined"
        margin="normal"
        inputProps={{
          min,
          max,
          step,
        }}
      />
    );
  };