export type CycleType = "Otto" | "Diesel" | "Brayton";

export interface CycleParams {
  // Common parameters for all cycles
  T_1?: number; // Initial temperature (K)
  p_1?: number; // Initial pressure (kPa)
  v_1?: number; // Initial specific volume (m³/kg)
  T_2?: number; // Temperature at state 2 (K)
  p_2?: number; // Pressure at state 2 (kPa)
  v_2?: number; // Specific volume at state 2 (m³/kg)
  T_3?: number; // Temperature at state 3 (K)
  p_3?: number; // Pressure at state 3 (kPa)
  v_3?: number; // Specific volume at state 3 (m³/kg)
  T_4?: number; // Temperature at state 4 (K)
  p_4?: number; // Pressure at state 4 (kPa)
  v_4?: number; // Specific volume at state 4 (m³/kg)

  // For backward compatibility with components still using these properties
  T_low?: number; // Low temperature (K)
  T_high?: number; // High temperature (K)
  p_low?: number; // Low pressure (kPa)
  p_high?: number; // High pressure (kPa)

  // Component efficiencies
  eta_compressor?: number; // Compressor isentropic efficiency
  eta_turbine?: number; // Turbine isentropic efficiency
  eta_pump?: number; // Pump isentropic efficiency for Rankine cycle

  // Cycle specific parameters
  compression_ratio?: number; // For Otto and Diesel cycles
  cutoff_ratio?: number; // For Diesel cycle
  pressure_ratio?: number; // For Brayton cycle
  superheater_temp_increase?: number; // For Rankine cycle

  // Thermodynamic properties
  gamma?: number; // Ratio of specific heats
  R?: number; // Gas constant (kJ/kg·K)
  cp?: number; // Specific heat at constant pressure (kJ/kg·K)
  cv?: number; // Specific heat at constant volume (kJ/kg·K)

  // Additional parameters
  heat_input?: number; // Heat input to the cycle (kJ/kg)
  power_output?: number; // Desired power output (MW) - OPTIONAL
  mass_flow?: number; // Mass flow rate (kg/s) - OPTIONAL
}

export interface StatePoint {
  p: number; // Pressure (kPa)
  T: number; // Temperature (K)
  v: number; // Specific volume (m³/kg)
  h: number; // Enthalpy (kJ/kg)
  s: number; // Entropy (kJ/kg·K)
  x?: number; // Quality (for two-phase states)
}

export interface CycleState {
  points: Record<string, StatePoint>;
  performance: {
    work_net: number; // Net work (kJ/kg)
    heat_input: number; // Heat input (kJ/kg)
    heat_rejected: number; // Heat rejected (kJ/kg)
    efficiency: number; // Thermal efficiency
    mass_flow?: number; // Mass flow rate (kg/s) - OPTIONAL
    power_output?: number; // Power output (MW) - OPTIONAL
    work_compressor?: number; // Compressor work (kJ/kg)
    work_turbine?: number; // Turbine work (kJ/kg)
    work_compressor_ideal?: number; // Ideal compressor work (kJ/kg)
    work_turbine_ideal?: number; // Ideal turbine work (kJ/kg)
    heat_input_ideal?: number; // Ideal heat input (kJ/kg)
    heat_rejected_ideal?: number; // Ideal heat rejected (kJ/kg)
    efficiency_ideal?: number; // Ideal thermal efficiency
    back_work_ratio?: number; // Back work ratio
    work_net_ideal?: number; // Ideal net work (kJ/kg)
  };
}

export const defaultCycleParams: Record<CycleType, CycleParams> = {
  Otto: {
    T_1: 300,
    p_1: 100,
    v_1: 0.5,
    compression_ratio: 8,
    heat_input: 800,
    gamma: 1.4,
    R: 0.287,
    power_output: 100,
    // Add compatibility properties
    T_low: 300,
    T_high: 2000,
    p_low: 100,
    p_high: 800,
  },
  Diesel: {
    T_1: 300,
    p_1: 100,
    v_1: 0.8,
    compression_ratio: 18,
    cutoff_ratio: 2,
    heat_input: 1000,
    gamma: 1.4,
    R: 0.287,
    power_output: 100,
    // Add compatibility properties
    T_low: 300,
    T_high: 1800,
    p_low: 100,
    p_high: 1800,
  },
  Brayton: {
    T_1: 300, // 27°C in Kelvin
    p_1: 100, // 100 kPa = 0.1 MPa (minimum cycle pressure)
    v_1: 0.8,
    p_2: 625, // Maximum cycle pressure (kPa)
    pressure_ratio: 6.25, // Default pressure ratio
    T_3: 1073, // 800°C in Kelvin
    gamma: 1.4, // Ratio of specific heats for air
    cp: 1.005, // Specific heat at constant pressure for air (kJ/kg·K)
    R: 0.287, // Gas constant for air (kJ/kg·K)
    eta_compressor: 0.8, // 80% efficiency
    eta_turbine: 0.8, // 80% efficiency
    power_output: 70, // Default power output in MW
    // Add compatibility properties
    T_low: 300,
    T_high: 1073,
    p_low: 100,
    p_high: 625,
  },
  // Rankine: {
  //   T_1: 318,         // 45°C condensate temperature
  //   p_1: 10,          // 10 kPa condenser pressure
  //   p_2: 10000,       // 10 MPa boiler pressure
  //   T_3: 673,         // 400°C boiler outlet temperature
  //   eta_pump: 0.85,   // Pump efficiency
  //   eta_turbine: 0.87, // Turbine efficiency
  //   superheater_temp_increase: 150, // Temperature increase in superheater (K)
  //   power_output: 100, // Default power output in MW
  //   T_low: 318,
  //   T_high: 673,
  //   p_low: 10,
  //   p_high: 10000
  // }
};
