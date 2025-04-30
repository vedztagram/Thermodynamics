// pages/cycles/Diesel.tsx
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ParameterControls from "@/components/controls/ParameterControls";
import { CycleType, CycleParams, defaultCycleParams } from "@/lib/types";

const gamma = 1.4;
const Cp = 1.005; // kJ/kg.K
const Cv = 0.718; // kJ/kg.K
const R = 0.287; // kJ/kg.K

const calculateDieselCycle = (params: CycleParams) => {
  const { compression_ratio: r, cutoff_ratio: rc, T_1, p_1 } = params;

  // Calculate specific volumes (for m = 1 kg)
  const v1 = (R * T_1) / p_1;
  const v2 = v1 / r;
  const v3 = rc * v2;
  const v4 = v1; // returns to original volume

  // State 2 (after isentropic compression)
  const T2 = T_1 * Math.pow(r, gamma - 1);
  const P2 = p_1 * Math.pow(r, gamma);

  // State 3 (after constant pressure heat addition)
  const T3 = T2 * rc;
  const P3 = P2; // constant pressure process

  // State 4 (after isentropic expansion)
  const T4 = T3 * Math.pow(rc / r, gamma - 1);
  const P4 = P3 * Math.pow(rc / r, gamma);

  // Heat added and rejected (per kg)
  const Qin = Cp * (T3 - T2);
  const Qout = Cv * (T4 - T_1);

  // Net work (per kg)
  const Wnet = Qin - Qout;

  // Thermal efficiency
  const efficiency = Wnet / Qin;

  // Mean Effective Pressure (per kg)
  const Vswept = v1 - v2;
  const MEP = Wnet / Vswept;

  return {
    T1: T_1,
    T2,
    T3,
    T4,
    P1: p_1,
    P2,
    P3,
    P4,
    v1,
    v2,
    v3,
    v4,
    Qin,
    Qout,
    Wnet,
    efficiency,
    MEP,
  };
};

const DieselCycle = () => {
  const [params, setParams] = useState<CycleParams>({
    compression_ratio: 18,
    cutoff_ratio: 2,
    T_1: 300, // Kelvin
    p_1: 100, // kPa (0.1 MPa)
    gamma,
    cv: Cv,
    cp: Cp,
    R,
  });

  const result = calculateDieselCycle(params);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Diesel Cycle Simulator</h1>

        <ParameterControls
          cycleType="Diesel"
          cycleParams={params}
          onParamChange={(newParams) =>
            setParams((prev) => ({ ...prev, ...newParams }))
          }
        />

        <div className="mt-6 p-4 border rounded-md bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">State Points (for 1 kg air)</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  State 1 (P₁, T₁, v₁):{" "}
                  <strong>
                    {params.p_1} kPa, {params.T_1} K, {result.v1.toFixed(4)}{" "}
                    m³/kg
                  </strong>
                </li>
                <li>
                  State 2 (P₂, T₂, v₂):{" "}
                  <strong>
                    {result.P2.toFixed(2)} kPa, {result.T2.toFixed(2)} K,{" "}
                    {result.v2.toFixed(6)} m³/kg
                  </strong>
                </li>
                <li>
                  State 3 (P₃, T₃, v₃):{" "}
                  <strong>
                    {result.P3.toFixed(2)} kPa, {result.T3.toFixed(2)} K,{" "}
                    {result.v3.toFixed(6)} m³/kg
                  </strong>
                </li>
                <li>
                  State 4 (P₄, T₄, v₄):{" "}
                  <strong>
                    {result.P4.toFixed(2)} kPa, {result.T4.toFixed(2)} K,{" "}
                    {result.v4.toFixed(4)} m³/kg
                  </strong>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Cycle Performance</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  Heat Added (Qin):{" "}
                  <strong>{result.Qin.toFixed(2)} kJ/kg</strong>
                </li>
                <li>
                  Heat Rejected (Qout):{" "}
                  <strong>{result.Qout.toFixed(2)} kJ/kg</strong>
                </li>
                <li>
                  Net Work (Wnet):{" "}
                  <strong>{result.Wnet.toFixed(2)} kJ/kg</strong>
                </li>
                <li>
                  Thermal Efficiency:{" "}
                  <strong>{(result.efficiency * 100).toFixed(2)}%</strong>
                </li>
                <li>
                  Mean Effective Pressure (MEP):{" "}
                  <strong>{(result.MEP / 1000).toFixed(3)} MPa</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h3 className="font-medium mb-2">Calculations Verification</h3>
          <div className="text-xs space-y-1">
            <p>T₂ = T₁ × r^(γ-1) = 300 × 18^(0.4) = {result.T2.toFixed(2)} K</p>
            <p>
              T₃ = T₂ × rc = {result.T2.toFixed(2)} × 2 = {result.T3.toFixed(2)}{" "}
              K
            </p>
            <p>
              T₄ = T₃ × (rc/r)^(γ-1) = {result.T3.toFixed(2)} × (2/18)^0.4 ={" "}
              {result.T4.toFixed(2)} K
            </p>
            <p>
              Qin = Cp(T₃-T₂) = 1.005 × ({result.T3.toFixed(2)}-
              {result.T2.toFixed(2)}) = {result.Qin.toFixed(2)} kJ/kg
            </p>
            <p>
              Qout = Cv(T₄-T₁) = 0.718 × ({result.T4.toFixed(2)}-300) ={" "}
              {result.Qout.toFixed(2)} kJ/kg
            </p>
            <p>
              η = (Qin-Qout)/Qin = ({result.Qin.toFixed(2)}-
              {result.Qout.toFixed(2)})/{result.Qin.toFixed(2)} ={" "}
              {(result.efficiency * 100).toFixed(2)}%
            </p>
            <p>
              MEP = Wnet/(v₁-v₂) = {result.Wnet.toFixed(2)}/(
              {result.v1.toFixed(4)}-{result.v2.toFixed(4)}) ={" "}
              {result.MEP.toFixed(2)} kPa = {(result.MEP / 1000).toFixed(3)} MPa
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DieselCycle;
