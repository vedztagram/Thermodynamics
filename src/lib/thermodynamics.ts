import { CycleType, CycleParams, CycleState, StatePoint } from "@/lib/types";

/**
 * Calculates thermodynamic properties for different cycle types
 */
export function calculateCycleStatePoints(
  cycleType: CycleType,
  cycleParams: CycleParams,
): CycleState {
  // For backward compatibility, ensure T_high, T_low etc. are populated
  const updatedParams = {
    ...cycleParams,
    T_1: cycleParams.T_1 || cycleParams.T_low,
    T_3: cycleParams.T_3 || cycleParams.T_high,
    p_1: cycleParams.p_1 || cycleParams.p_low,
    p_3: cycleParams.p_3 || cycleParams.p_high || cycleParams.p_2,
  };

  // Implementation for different cycle types
  switch (cycleType) {
    case "Otto":
      return calculateOttoCycle(updatedParams);
    case "Diesel":
      return calculateDieselCycle(updatedParams);
    case "Brayton":
      return calculateBraytonCycle(updatedParams);
    case "Rankine":
      return calculateRankineCycle(updatedParams);
    default:
      throw new Error(`Unsupported cycle type: ${cycleType}`);
  }
}

/**
 * Calculate Otto cycle thermodynamic properties
 */
function calculateOttoCycle(params: CycleParams): CycleState {
  const {
    T_1 = 300,
    p_1 = 100,
    v_1 = 0.5,
    compression_ratio = 8,
    heat_input = 800,
    power_output,
    mass_flow,
    gamma = 1.4, // Ratio of specific heats for air
    R = 0.287, // Gas constant for air in kJ/kg·K
  } = params;

  // Baseline entropy value (non-zero)
  const s_1 = 0.5; // Reference entropy in kJ/kg·K
  const cp = (gamma * R) / (gamma - 1);
  const h_1 = calculateEnthalpyIdealGas(T_1, gamma, R);

  // State 2: End of compression (top dead center, before combustion)
  const v_2 = v_1 / compression_ratio;
  const T_2 = T_1 * Math.pow(compression_ratio, gamma - 1);
  const p_2 = p_1 * Math.pow(compression_ratio, gamma);
  // Isentropic compression - no entropy change
  const s_2 = s_1;
  const h_2 = calculateEnthalpyIdealGas(T_2, gamma, R);

  // State 3: End of combustion (constant volume heat addition)
  const v_3 = v_2; // Volume doesn't change
  const h_3 = h_2 + heat_input;
  const T_3 = h_3 / ((gamma * R) / (gamma - 1));
  const p_3 = p_2 * (T_3 / T_2);
  const s_3 = s_2 + calculateEntropyChangeConstantVolume(gamma, R, T_2, T_3);

  // State 4: End of expansion (before exhaust valve opens)
  const v_4 = v_1;
  const T_4 = T_3 * Math.pow(v_3 / v_4, gamma - 1);
  const p_4 = p_3 * Math.pow(v_3 / v_4, gamma);
  // Isentropic expansion - no entropy change from state 3
  const s_4 = s_3;
  const h_4 = calculateEnthalpyIdealGas(T_4, gamma, R);

  // Performance calculations
  const heat_added = h_3 - h_2;
  const heat_rejected = Math.max(0, h_4 - h_1); // Ensure non-negative
  const work_net = Math.max(0, heat_added - heat_rejected); // Ensure non-negative
  const efficiency = work_net > 0 ? work_net / heat_added : 0; // Avoid division by zero

  // Mass flow calculation
  let calculatedMassFlow: number | undefined;
  if (power_output !== undefined && work_net > 0) {
    calculatedMassFlow = (power_output * 1000) / work_net;
  } else if (mass_flow !== undefined) {
    calculatedMassFlow = mass_flow;
  }

  // Calculate power output if mass flow is specified but power_output isn't
  let calculatedPowerOutput: number | undefined;
  if (mass_flow !== undefined && power_output === undefined) {
    calculatedPowerOutput = (work_net * mass_flow) / 1000; // Convert to MW
  } else if (power_output !== undefined) {
    calculatedPowerOutput = power_output;
  }

  // Update backward compatibility properties
  params.T_high = T_3;
  params.T_low = T_1;
  params.p_high = p_3;
  params.p_low = p_1;

  return {
    points: {
      "1": { p: p_1, T: T_1, v: v_1, h: h_1, s: s_1 },
      "2": { p: p_2, T: T_2, v: v_2, h: h_2, s: s_2 },
      "3": { p: p_3, T: T_3, v: v_3, h: h_3, s: s_3 },
      "4": { p: p_4, T: T_4, v: v_4, h: h_4, s: s_4 },
    },
    performance: {
      work_net,
      heat_input: heat_added,
      heat_rejected,
      efficiency,
      mass_flow: calculatedMassFlow,
      power_output: calculatedPowerOutput,
    },
  };
}

/**
 * Calculate Diesel cycle thermodynamic properties
 */
function calculateDieselCycle(params: CycleParams): CycleState {
  const {
    T_1 = 300,
    p_1 = 100,
    v_1 = 0.8,
    compression_ratio = 18,
    cutoff_ratio = 2,
    heat_input = 1000,
    power_output,
    mass_flow,
    gamma = 1.4, // Ratio of specific heats for air
    R = 0.287, // Gas constant for air in kJ/kg·K
  } = params;

  // Baseline entropy value (non-zero)
  const s_1 = 0.5; // Reference entropy in kJ/kg·K
  const cp = (gamma * R) / (gamma - 1);
  const h_1 = calculateEnthalpyIdealGas(T_1, gamma, R);

  // State 2: End of compression
  const v_2 = v_1 / compression_ratio;
  const T_2 = T_1 * Math.pow(compression_ratio, gamma - 1);
  const p_2 = p_1 * Math.pow(compression_ratio, gamma);
  // Isentropic compression - no entropy change
  const s_2 = s_1;
  const h_2 = calculateEnthalpyIdealGas(T_2, gamma, R);

  // State 3: End of constant pressure heat addition
  const v_3 = v_2 * cutoff_ratio;
  const T_3 = T_2 * cutoff_ratio;
  const p_3 = p_2; // Constant pressure process
  // Calculate entropy change for constant pressure heat addition
  const s_3 = s_2 + calculateEntropyChangeConstantPressure(gamma, R, T_2, T_3);
  const h_3 = calculateEnthalpyIdealGas(T_3, gamma, R);

  // State 4: End of expansion
  const v_4 = v_1;
  const T_4 = T_3 * Math.pow(v_3 / v_4, gamma - 1);
  const p_4 = p_3 * Math.pow(v_3 / v_4, gamma);
  // Isentropic expansion - no entropy change from state 3
  const s_4 = s_3;
  const h_4 = calculateEnthalpyIdealGas(T_4, gamma, R);

  // Performance calculations
  const heat_added = h_3 - h_2;
  const heat_rejected = Math.max(0, h_4 - h_1); // Ensure non-negative
  const work_net = Math.max(0, heat_added - heat_rejected); // Ensure non-negative
  const efficiency = work_net > 0 ? work_net / heat_added : 0; // Avoid division by zero

  // Mass flow calculation
  let calculatedMassFlow: number | undefined;
  if (power_output !== undefined && work_net > 0) {
    calculatedMassFlow = (power_output * 1000) / work_net;
  } else if (mass_flow !== undefined) {
    calculatedMassFlow = mass_flow;
  }

  // Calculate power output if mass flow is specified but power_output isn't
  let calculatedPowerOutput: number | undefined;
  if (mass_flow !== undefined && power_output === undefined) {
    calculatedPowerOutput = (work_net * mass_flow) / 1000; // Convert to MW
  } else if (power_output !== undefined) {
    calculatedPowerOutput = power_output;
  }

  // Update backward compatibility properties
  params.T_high = T_3;
  params.T_low = T_1;
  params.p_high = p_2; // In Diesel, max pressure is at end of compression
  params.p_low = p_1;

  return {
    points: {
      "1": { p: p_1, T: T_1, v: v_1, h: h_1, s: s_1 },
      "2": { p: p_2, T: T_2, v: v_2, h: h_2, s: s_2 },
      "3": { p: p_3, T: T_3, v: v_3, h: h_3, s: s_3 },
      "4": { p: p_4, T: T_4, v: v_4, h: h_4, s: s_4 },
    },
    performance: {
      work_net,
      heat_input: heat_added,
      heat_rejected,
      efficiency,
      mass_flow: calculatedMassFlow,
      power_output: calculatedPowerOutput,
    },
  };
}

/**
 * Calculate Brayton cycle thermodynamic properties
 */
function calculateBraytonCycle(params: CycleParams): CycleState {
  const {
    T_1 = 300, // 27°C in K (ambient temperature)
    T_3 = 1000, // 727°C in K (maximum temperature)
    pressure_ratio, // p_2/p_1 = p_3/p_4
    p_2, // Maximum pressure (kPa) (directly specified)
    v_1 = 0.8, // Initial specific volume (m³/kg)
    eta_compressor = 1.0, // Compressor efficiency (1.0 = ideal)
    eta_turbine = 1.0, // Turbine efficiency (1.0 = ideal)
    gamma = 1.4, // Ratio of specific heats for air
    cp = 1.005, // Specific heat at constant pressure (kJ/kg·K) for air
    R = 0.287, // Gas constant for air (kJ/kg·K)
    power_output, // Power output (MW) - OPTIONAL
    mass_flow, // Mass flow rate (kg/s) - OPTIONAL
  } = params;

  // Determine pressure values - with support for p_1 not being provided
  let actualPressureRatio: number;
  let p1Value: number;
  let p2Value: number;

  if (pressure_ratio) {
    actualPressureRatio = pressure_ratio;

    if (params.p_1) {
      // If p_1 is provided and we have pressure ratio, calculate p_2
      p1Value = params.p_1;
      p2Value = p1Value * actualPressureRatio;
    } else if (p_2) {
      // If p_2 is provided and we have pressure ratio, calculate p_1
      p2Value = p_2;
      p1Value = p2Value / actualPressureRatio;
    } else {
      // If neither p_1 nor p_2 is provided, use default p_1 and calculate p_2
      p1Value = 100; // Default minimum pressure (kPa)
      p2Value = p1Value * actualPressureRatio;
    }
  } else if (params.p_1 && p_2) {
    // If both p_1 and p_2 are provided but no pressure ratio, calculate it
    p1Value = params.p_1;
    p2Value = p_2;
    actualPressureRatio = p2Value / p1Value;
  } else {
    // Default values if insufficient information is provided
    p1Value = params.p_1 || 100;
    actualPressureRatio = 20; // Default for the example: 2000/100 = 20
    p2Value = p_2 || p1Value * actualPressureRatio;
  }

  // Calculate pressures based on pressure values
  const p_3 = p2Value; // Constant pressure heat addition
  const p_4 = p1Value; // Cycle completes back to initial pressure

  // State 1: Compressor inlet
  // Use a non-zero baseline value for entropy
  const s_1 = 0.5; // Reference entropy (arbitrary baseline)
  const h_1 = cp * T_1;

  // State 2_ideal (isentropic compression) and State 2 (actual)
  // Use the direct formula from the numerical problem: T2 = T1 * (p2/p1)^((γ-1)/γ)
  // For the example: T2 = 300K * (2000kPa/100kPa)^(0.4/1.4) = 300K * 20^(0.4/1.4) = 706.1K
  const exponent = (gamma - 1) / gamma;
  const T_2_isentropic = T_1 * Math.pow(actualPressureRatio, exponent);
  const v_2_isentropic = (v_1 * (T_2_isentropic / T_1)) / actualPressureRatio;
  const h_2_isentropic = cp * T_2_isentropic;
  const s_2_isentropic = s_1;

  // For ideal cycle where eta_compressor = 1.0, T_2 = T_2_isentropic
  // For non-ideal cycle, T_2 = T_1 + (T_2_isentropic - T_1) / eta_compressor
  const T_2 = T_1 + (T_2_isentropic - T_1) / eta_compressor;
  const v_2 = (v_1 * (T_2 / T_1)) / actualPressureRatio;
  const s_2 = s_1 + cp * Math.log(T_2 / T_1) - R * Math.log(p2Value / p1Value);
  const h_2 = cp * T_2;

  // State 3: Combustor outlet / turbine inlet
  const h_3 = cp * T_3;
  const v_3 = v_2 * (T_3 / T_2);

  // Calculate entropy change for constant pressure heat addition
  const s_3 = s_2 + cp * Math.log(T_3 / T_2);

  // State 4_ideal (isentropic expansion) and State 4 (actual)
  // Use the direct formula from the numerical problem: T4 = T3 * (p4/p3)^((γ-1)/γ)
  // For the example: T4 = 1000K * (100kPa/2000kPa)^(0.4/1.4) = 1000K * (1/20)^(0.4/1.4) = 424.9K
  const T_4_isentropic = T_3 * Math.pow(p_4 / p_3, exponent);
  const v_4_isentropic = v_3 * (T_4_isentropic / T_3) * (p_3 / p_4);
  const h_4_isentropic = cp * T_4_isentropic;
  const s_4_isentropic = s_3;

  // For ideal cycle where eta_turbine = 1.0, T_4 = T_4_isentropic
  // For non-ideal cycle, T_4 = T_3 - eta_turbine * (T_3 - T_4_isentropic)
  const T_4 = T_3 - eta_turbine * (T_3 - T_4_isentropic);
  const v_4 = v_3 * (T_4 / T_3) * (p_3 / p_4);
  const s_4 = s_3 + cp * Math.log(T_4 / T_3) - R * Math.log(p_4 / p_3);
  const h_4 = cp * T_4;

  // Performance calculations - follow the formulas from the numerical problem
  // qin = cp * (T3 - T2) = 1.005 * (1000 - 706.1) = 295.4 kJ/kg
  const heat_added = cp * (T_3 - T_2);

  // qout = cp * (T4 - T1) = 1.005 * (424.9 - 300) = 125.5 kJ/kg
  const heat_rejected = cp * (T_4 - T_1);

  // wnet = qin - qout = 295.4 - 125.5 = 169.9 kJ/kg
  const work_net = heat_added - heat_rejected;

  // Alternatively, calculate via compressor and turbine work:
  const work_compressor = cp * (T_2 - T_1);
  const work_turbine = cp * (T_3 - T_4);
  const work_net_alt = work_turbine - work_compressor;

  // Thermal efficiency = wnet/qin = 169.9/295.4 = 0.575 = 57.5%
  const efficiency = work_net / heat_added;

  // Handle mass flow and power output calculations
  let calculatedMassFlow: number | undefined;
  let calculatedPowerOutput: number | undefined;

  if (power_output !== undefined && work_net > 0) {
    // Calculate mass flow from power output
    calculatedMassFlow = (power_output * 1000) / work_net; // Mass flow rate (kg/s)
    calculatedPowerOutput = power_output;
  } else if (mass_flow !== undefined) {
    // Use provided mass flow and calculate power output
    calculatedMassFlow = mass_flow;
    calculatedPowerOutput = (work_net * mass_flow) / 1000; // Convert kW to MW
  }

  // Update backward compatibility properties
  params.T_high = T_3;
  params.T_low = T_1;
  params.p_high = p2Value;
  params.p_low = p1Value;
  params.p_1 = p1Value;
  params.p_2 = p2Value;
  params.pressure_ratio = actualPressureRatio;

  return {
    points: {
      "1": { p: p1Value, T: T_1, v: v_1, h: h_1, s: s_1 },
      "1s": {
        p: p2Value,
        T: T_2_isentropic,
        v: v_2_isentropic,
        h: h_2_isentropic,
        s: s_1,
      }, // Ideal compression end point
      "2": { p: p2Value, T: T_2, v: v_2, h: h_2, s: s_2 },
      "3": { p: p_3, T: T_3, v: v_3, h: h_3, s: s_3 },
      "4s": {
        p: p_4,
        T: T_4_isentropic,
        v: v_4_isentropic,
        h: h_4_isentropic,
        s: s_3,
      }, // Ideal expansion end point
      "4": { p: p_4, T: T_4, v: v_4, h: h_4, s: s_4 },
    },
    performance: {
      work_compressor,
      work_compressor_ideal: work_compressor, // Same for ideal cycle
      work_turbine,
      work_turbine_ideal: work_turbine, // Same for ideal cycle
      work_net,
      work_net_ideal: work_net, // Same for ideal cycle
      heat_input: heat_added,
      heat_input_ideal: heat_added, // Same for ideal cycle
      heat_rejected,
      heat_rejected_ideal: heat_rejected, // Same for ideal cycle
      efficiency,
      efficiency_ideal: efficiency, // Same for ideal cycle
      back_work_ratio: work_compressor / work_turbine,
      mass_flow: calculatedMassFlow,
      power_output: calculatedPowerOutput,
    },
  };
}

/**
 * Calculate Rankine cycle thermodynamic properties
 * This is a simplified implementation
 */
function calculateRankineCycle(params: CycleParams): CycleState {
  const {
    T_1 = 318, // 45°C in K (condenser temperature)
    p_1 = 10, // 10 kPa (condenser pressure)
    p_2 = 10000, // 10 MPa (boiler pressure)
    T_3 = 673, // 400°C in K (turbine inlet temperature)
    eta_pump = 0.85, // Pump efficiency
    eta_turbine = 0.87, // Turbine efficiency
    superheater_temp_increase = 150, // Superheater temperature increase
    power_output, // Power output (MW) - OPTIONAL
    mass_flow, // Mass flow rate (kg/s) - OPTIONAL
  } = params;

  // Baseline entropy and enthalpy values
  const s_1 = 1.0; // Reference entropy in kJ/kg·K
  const h_1 = 200; // Reference enthalpy in kJ/kg for saturated water

  // State 2: After pump (compressed liquid)
  const h_2_ideal = h_1 + (p_2 - p_1) * 0.001; // Ideal pump work (kJ/kg), using v ≈ 0.001 m³/kg for water
  const h_2 = h_1 + (h_2_ideal - h_1) / eta_pump; // Actual enthalpy after non-isentropic compression
  const s_2 = s_1; // Approximately isentropic for liquid
  const T_2 = T_1 + 5; // Slight temperature increase from pump work
  const v_2 = 0.001; // Approximate specific volume for compressed liquid

  // State 3: After boiler and superheater (superheated steam)
  const h_3 = 3500; // Approximate enthalpy for superheated steam (kJ/kg)
  const s_3 = 7.0; // Approximate entropy for superheated steam
  const v_3 = 0.02; // Approximate specific volume for superheated steam

  // State 4: After turbine (condensing steam)
  const h_4_ideal = 2500; // Approximate enthalpy after ideal expansion
  const h_4 = h_3 - eta_turbine * (h_3 - h_4_ideal); // Actual enthalpy after non-isentropic expansion
  const s_4 = 8.0; // Entropy increases due to irreversibilities
  const T_4 = T_1 + 10; // Slightly above condenser temperature
  const v_4 = 10.0; // Approximate specific volume for wet steam

  // Performance calculations
  const work_pump = h_2 - h_1;
  const heat_input = h_3 - h_2;
  const work_turbine = h_3 - h_4;
  const work_net = work_turbine - work_pump;
  const heat_rejected = h_4 - h_1;
  const efficiency = work_net / heat_input;

  // Mass flow calculation
  let calculatedMassFlow: number | undefined;
  if (power_output !== undefined && work_net > 0) {
    calculatedMassFlow = (power_output * 1000) / work_net;
  } else if (mass_flow !== undefined) {
    calculatedMassFlow = mass_flow;
  }

  // Calculate power output if mass flow is specified but power_output isn't
  let calculatedPowerOutput: number | undefined;
  if (mass_flow !== undefined && power_output === undefined) {
    calculatedPowerOutput = (work_net * mass_flow) / 1000; // Convert to MW
  } else if (power_output !== undefined) {
    calculatedPowerOutput = power_output;
  }

  // Update backward compatibility properties
  params.T_high = T_3;
  params.T_low = T_1;
  params.p_high = p_2;
  params.p_low = p_1;

  return {
    points: {
      "1": { p: p_1, T: T_1, v: 0.001, h: h_1, s: s_1 },
      "2": { p: p_2, T: T_2, v: v_2, h: h_2, s: s_2 },
      "3": { p: p_2, T: T_3, v: v_3, h: h_3, s: s_3 },
      "4": { p: p_1, T: T_4, v: v_4, h: h_4, s: s_4 },
    },
    performance: {
      work_net,
      heat_input,
      heat_rejected,
      efficiency,
      mass_flow: calculatedMassFlow,
      power_output: calculatedPowerOutput,
      work_compressor: work_pump, // Use compressor field for pump work
      work_turbine,
    },
  };
}

/**
 * Helper function to calculate enthalpy for ideal gas
 */
function calculateEnthalpyIdealGas(
  T: number,
  gamma: number,
  R: number,
): number {
  // For ideal gas: h = cp * T, where cp = gamma * R / (gamma - 1)
  const cp = (gamma * R) / (gamma - 1);
  return cp * T;
}

/**
 * Calculate entropy change for constant volume process
 */
function calculateEntropyChangeConstantVolume(
  gamma: number,
  R: number,
  T1: number,
  T2: number,
): number {
  const cv = R / (gamma - 1);
  return cv * Math.log(T2 / T1);
}

/**
 * Calculate entropy change for constant pressure process
 */
function calculateEntropyChangeConstantPressure(
  gamma: number,
  R: number,
  T1: number,
  T2: number,
): number {
  const cp = (gamma * R) / (gamma - 1);
  return cp * Math.log(T2 / T1);
}
