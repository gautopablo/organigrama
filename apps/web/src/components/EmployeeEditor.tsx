import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { OrgNode } from "../types/orgchart";
import { FiX, FiSave, FiUser } from "react-icons/fi";

interface Props {
  employee: OrgNode | null;
  onClose: () => void;
  onSave: () => void;
}

export function EmployeeEditor({ employee, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    nombre: "",
    cargo: "",
    area: "",
    division: "",
    email: "",
    manager_id: ""
  });
  const [employees, setEmployees] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        nombre: employee.nombre,
        cargo: employee.cargo || "",
        area: employee.area || "",
        division: employee.division || "",
        email: employee.email || "",
        manager_id: employee.manager_id || ""
      });
    }
  }, [employee]);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      const { data } = await supabase
        .from("employees")
        .select("id, nombre")
        .order("nombre");
      if (data) setEmployees(data);
      setLoading(false);
    }
    fetchEmployees();
  }, []);

  if (!employee) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setSaving(true);

    try {
      const currentEmployeeId = employee.employee_id;
      const currentManagerId = employee.manager_id;

      // 1. Actualizar datos básicos
      const { error: empError } = await supabase
        .from("employees")
        .update({
          nombre: formData.nombre,
          cargo: formData.cargo,
          area: formData.area,
          division: formData.division,
          email: formData.email
        })
        .eq("id", currentEmployeeId);

      if (empError) throw empError;

      // 2. Actualizar línea de reporte si cambió
      if (formData.manager_id !== currentManagerId) {
        // Desactivar líneas anteriores
        await supabase
          .from("reporting_lines")
          .update({ active: false })
          .eq("employee_id", currentEmployeeId);

        // Crear nueva línea si hay un manager seleccionado
        if (formData.manager_id) {
          const { error: lineError } = await supabase
            .from("reporting_lines")
            .insert({
              employee_id: currentEmployeeId,
              manager_id: formData.manager_id,
              source: 'manual',
              confidence: 'AUTO_OK'
            });
          if (lineError) throw lineError;
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`editor-sidebar ${employee ? 'open' : ''}`}>
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar-circle">
            <FiUser size={20} />
          </div>
          <div>
            <h3>Editar Colaborador</h3>
            <p>{employee.nombre}</p>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">
          <FiX size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Cargo / Puesto</label>
          <input
            type="text"
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Área / Departamento</label>
          <input
            type="text"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>División</label>
          <input
            type="text"
            value={formData.division}
            onChange={(e) => setFormData({ ...formData, division: e.target.value })}
            placeholder="Ej: Planta San Juan, Administración..."
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Reporta a (Manager)</label>
          <select
            value={formData.manager_id}
            onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
            disabled={loading}
          >
            <option value="">(Sin Manager - Nivel 0)</option>
            {employees
              .filter(emp => emp.id !== employee.employee_id) // No puede reportarse a sí mismo
              .map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
          </select>
        </div>

        <div className="editor-actions">
          <button type="button" onClick={onClose} className="secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="primary">
            <FiSave size={16} />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
