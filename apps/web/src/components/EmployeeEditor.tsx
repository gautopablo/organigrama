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
    legajo: "",
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

  const isNew = employee?.employee_id === "new";

  useEffect(() => {
    if (employee) {
      setFormData({
        legajo: employee.legajo || "",
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
        .eq("active", true)
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
      const normalized_name = formData.nombre.toLowerCase().trim().replace(/\s+/g, ' ');
      const employeeData = {
        legajo: formData.legajo,
        nombre: formData.nombre,
        normalized_name,
        cargo: formData.cargo,
        area: formData.area,
        division: formData.division,
        email: formData.email || null,
        active: true,
        estado: 'ACTIVE'
      };

      let currentEmployeeId = employee.employee_id;

      if (isNew) {
        // 1. Insertar nuevo empleado
        const { data, error: insError } = await supabase
          .from("employees")
          .insert([employeeData])
          .select()
          .single();

        if (insError) throw insError;
        currentEmployeeId = data.id;

        // 2. Crear línea de reporte inicial
        const newManagerId = formData.manager_id === "" ? null : formData.manager_id;
        const { error: lineError } = await supabase
          .from("reporting_lines")
          .insert([{
            employee_id: currentEmployeeId,
            manager_id: newManagerId,
            active: true,
            confidence: 'AUTO_OK',
            source: 'manual'
          }]);

        if (lineError) throw lineError;
      } else {
        // 1. Actualizar datos básicos
        const { error: empError } = await supabase
          .from("employees")
          .update(employeeData)
          .eq("id", currentEmployeeId);

        if (empError) throw empError;

        // 2. Actualizar línea de reporte si cambió
        const currentManagerId = employee.manager_id;
        const newManagerId = formData.manager_id === "" ? null : formData.manager_id;
        if (newManagerId !== currentManagerId) {
          const { error: rpcError } = await supabase.rpc('update_manager', {
            p_employee_id: currentEmployeeId,
            p_manager_id: newManagerId
          });
          
          if (rpcError) throw rpcError;
        }
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Error al guardar los cambios: " + (error as any).message);
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
            <h3>{isNew ? "Nueva Persona" : "Editar Colaborador"}</h3>
            <p>{isNew ? "Añadir al organigrama" : employee.nombre}</p>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">
          <FiX size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="editor-form">
        <div className="form-group">
          <label>Legajo (Obligatorio)</label>
          <input
            type="text"
            value={formData.legajo}
            onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
            required
            placeholder="Ej: 12345"
          />
        </div>

        <div className="form-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="form-group">
          <label>Cargo / Puesto</label>
          <input
            type="text"
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            placeholder="Ej: Analista de Sistemas"
          />
        </div>

        <div className="form-group">
          <label>Área / Departamento</label>
          <input
            type="text"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="Ej: IT"
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
            placeholder="ejemplo@empresa.com"
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
              .filter(emp => emp.id !== employee.employee_id)
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
            {saving ? "Guardando..." : isNew ? "Crear Persona" : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
