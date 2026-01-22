import React, { useState } from "react";
import axios from "axios";
import Constants from "../Constants";

interface DeviceMappingRequest {
  userName: string;
  tPImei: string;
  gVImei: string;
  tpActive: boolean;
  gvActive: boolean;
  defaultGV: boolean;
}

const DeviceRegistration: React.FC = () => {
  const [form, setForm] = useState<DeviceMappingRequest>({
    userName: "",
    tPImei: "",
    gVImei: "",
    tpActive: true,
    gvActive: true,
    defaultGV: false
  });

  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      await axios.post(
        Constants.BASE_URL +"/device/upsert-mapping",
        form
      );

      setMessage("Device mapping saved successfully ✅");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data || "Something went wrong ❌"
        );
      } else {
        setMessage("Something went wrong ❌");
      }
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>
      <h2>Device Registration</h2>

      <input
        name="userName"
        placeholder="User Name"
        value={form.userName}
        onChange={handleChange}
      />

      <input
        name="tPImei"
        placeholder="TP IMEI"
        value={form.tPImei}
        onChange={handleChange}
      />

      <input
        name="gVImei"
        placeholder="GV IMEI"
        value={form.gVImei}
        onChange={handleChange}
      />

      <label>
        <input
          type="checkbox"
          name="tpActive"
          checked={form.tpActive}
          onChange={handleChange}
        />
        TP Active
      </label>

      <label>
        <input
          type="checkbox"
          name="gvActive"
          checked={form.gvActive}
          onChange={handleChange}
        />
        GV Active
      </label>

      <label>
        <input
          type="checkbox"
          name="defaultGV"
          checked={form.defaultGV}
          onChange={handleChange}
        />
        Default GV
      </label>

      <button onClick={handleSubmit}>
        Save / Update
      </button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default DeviceRegistration;
