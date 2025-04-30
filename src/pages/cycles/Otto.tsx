// pages/cycles/Otto.tsx
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ParameterControls from "@/components/controls/ParameterControls";
import { CycleType, CycleParams, defaultCycleParams } from "@/lib/types";

const gamma = 1.4;
const Cv = 0.718; // kJ/kg.K
const R = 0.287; // kJ/kg.K

const calculateOttoCycle = (params: CycleParams) => {
  const { compression_ratio: r, T_1, p_1, v_1, T_3 } = params;

  // Calculate mass of air
  const m = (p_1 * v_1) / (R * T_1); // in kg

  // State 2 (after isentropic compression)
  const T2 = T_1 * Math.pow(r, gamma - 1);
  const P2 = p_1 * Math.pow(r, gamma);
  const V2 = v_1 / r;

  // State 3 (after heat addition at constant volume)
  const T3 = T_3;
  const P3 = P2 * (T3 / T2);
  const V3 = V2; // constant volume

  // State 4 (after isentropic expansion)
  const T4 = T3 / Math.pow(r, gamma - 1);
  const P4 = P3 / Math.pow(r, gamma);
  const V4 = v_1; // returns to original volume

  // Heat added and rejected (total, not per kg)
  const Qin = m * Cv * (T3 - T2);
  const Qout = m * Cv * (T4 - T_1);

  // Net work (total)
  const Wnet = Qin - Qout;

  // Thermal efficiency (theoretical)
  const efficiency = 1 - 1 / Math.pow(r, gamma - 1);

  // Mean Effective Pressure (using total work)
  const Vswept = v_1 - V2;
  const MEP = Wnet / Vswept;

  return {
    T2,
    T3,
    T4,
    P2,
    P3,
    P4,
    V2,
    V3,
    V4,
    Qin,
    Qout,
    Wnet,
    efficiency,
    MEP,
    mass: m,
  };
};

const OttoCycle = () => {
  const [params, setParams] = useState<CycleParams>({
    compression_ratio: 7,
    T_1: 273 + 27, // Kelvin
    T_3: 273 + 1127,
    p_1: 90,
    v_1: 0.004,
    gamma,
    cv: Cv,
    cp: 1.005,
    R,
  });

  const result = calculateOttoCycle(params);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Otto Cycle Simulator</h1>

        <ParameterControls
          cycleType="Otto"
          cycleParams={params}
          onParamChange={(newParams) =>
            setParams((prev) => ({ ...prev, ...newParams }))
          }
        />

        <div className="mt-6 p-4 border rounded-md bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">State Points</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  Mass of air: <strong>{result.mass.toFixed(6)} kg</strong>
                </li>
                <li>
                  State 1 (P₁, T₁, V₁):{" "}
                  <strong>
                    {params.p_1} kPa, {params.T_1.toFixed(2)} K, {params.v_1} m³
                  </strong>
                </li>
                <li>
                  State 2 (P₂, T₂, V₂):{" "}
                  <strong>
                    {result.P2.toFixed(2)} kPa, {result.T2.toFixed(2)} K,{" "}
                    {result.V2.toFixed(6)} m³
                  </strong>
                </li>
                <li>
                  State 3 (P₃, T₃, V₃):{" "}
                  <strong>
                    {result.P3.toFixed(2)} kPa, {result.T3.toFixed(2)} K,{" "}
                    {result.V3.toFixed(6)} m³
                  </strong>
                </li>
                <li>
                  State 4 (P₄, T₄, V₄):{" "}
                  <strong>
                    {result.P4.toFixed(2)} kPa, {result.T4.toFixed(2)} K,{" "}
                    {result.V4.toFixed(6)} m³
                  </strong>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Cycle Performance</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  Heat Added (Qin): <strong>{result.Qin.toFixed(3)} kJ</strong>
                </li>
                <li>
                  Heat Rejected (Qout):{" "}
                  <strong>{result.Qout.toFixed(3)} kJ</strong>
                </li>
                <li>
                  Net Work (Wnet): <strong>{result.Wnet.toFixed(3)} kJ</strong>
                </li>
                <li>
                  Theoretical Efficiency:{" "}
                  <strong>{(result.efficiency * 100).toFixed(2)}%</strong>
                </li>
                <li>
                  Actual Efficiency:{" "}
                  <strong>
                    {((result.Wnet / result.Qin) * 100).toFixed(2)}%
                  </strong>
                </li>
                <li>
                  Mean Effective Pressure (MEP):{" "}
                  <strong>{result.MEP.toFixed(0)} kPa</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OttoCycle;
