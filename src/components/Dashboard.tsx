import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Constants from "../Constants";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TP from "../assets/images/3TP.png";
import GV from "../assets/images/GV.png";
import {
  FaUser,
  FaMapMarkerAlt,
  FaThumbsUp,
  FaBolt,
  FaBatteryHalf,
  FaCheckCircle,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface DashboardProps {
  loggedInUser: string | null;
}

interface DeviceLiveData {
  imei: string;
  status: boolean;
  starTime: string;
  endTime: string;
  deviceType: number;
  defaultGV: boolean;
  battery: number;
  batStatus: string;
}

type DeviceView = "tp" | "gv";

const Dashboard: React.FC<DashboardProps> = ({ loggedInUser }) => {
  const [startDateTP, setStartDateTP] = useState<Date | null>(new Date());
  const [stopDateTP, setStopDateTP] = useState<Date | null>(new Date());

  const [threePhaseData, setThreePhaseData] = useState<DeviceLiveData | null>(
    null
  );
  const [gateValveDataList, setGateValveDataList] = useState<DeviceLiveData[]>(
    []
  );

  const [selectedView, setSelectedView] = useState<DeviceView>("tp");
  const [currentGateValveIndex, setCurrentGateValveIndex] = useState(0);
  const [gateValveDateSettings, setGateValveDateSettings] = useState<{
    [key: string]: { startDate: Date | null; stopDate: Date | null };
  }>({});

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const currentGateValve = gateValveDataList[currentGateValveIndex] || null;

  const getGateValveDateSettings = (imei: string) => {
    if (!gateValveDateSettings[imei]) {
      return { startDate: new Date(), stopDate: new Date() };
    }
    return gateValveDateSettings[imei];
  };

  const updateGateValveDateSettings = (
    imei: string,
    field: "startDate" | "stopDate",
    value: Date | null
  ) => {
    setGateValveDateSettings((prev) => ({
      ...prev,
      [imei]: {
        ...getGateValveDateSettings(imei),
        [field]: value,
      },
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get<DeviceLiveData[]>(
          `${Constants.BASE_URL}/Device/UserData/${loggedInUser}`
        );

        if (isMounted && response.data.length > 0) {
          const threePhaseDevice = response.data.find(
            (device) => device.deviceType === 1
          );

          const gateValveDevices = response.data.filter(
            (device) => device.deviceType === 2
          );

          setThreePhaseData(threePhaseDevice || null);
          setGateValveDataList(gateValveDevices);

          if (threePhaseDevice) {
            setStartDateTP(new Date(threePhaseDevice.starTime));
            setStopDateTP(new Date(threePhaseDevice.endTime));
          }

          const dateSettings: {
            [key: string]: { startDate: Date | null; stopDate: Date | null };
          } = {};
          gateValveDevices.forEach((device) => {
            dateSettings[device.imei] = {
              startDate: new Date(device.starTime),
              stopDate: new Date(device.endTime),
            };
          });
          setGateValveDateSettings(dateSettings);

          if (!threePhaseDevice && gateValveDevices.length > 0) {
            setSelectedView("gv");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [loggedInUser]);

  const toggleDefaultGateValve = async (imei: string) => {
    try {
      const updatedGateValves = gateValveDataList.map((device) => ({
        ...device,
        defaultGV: device.imei === imei ? !device.defaultGV : false,
      }));

      await axios.post(`${Constants.BASE_URL}/Device/UpdateDefaultGV`, {
        imei,
      });

      setGateValveDataList(updatedGateValves);

      toast.success("Default Gate Valve Updated", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Failed to update default gate valve:", error);
      toast.error("Failed to update default gate valve", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const formatDateToLocal = (date: Date | null) => {
    if (!date) return null;

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);

    return localDate.toISOString().replace("Z", "");
  };

  const updateThreePhaseData = async (
    imei: string,
    status: boolean,
    startTime: Date | null,
    endTime: Date | null
  ) => {
    if (!imei) {
      console.error("IMEI is missing");
      return;
    }

    try {
      const requestBody = {
        imei,
        status,
        starTime: formatDateToLocal(startTime),
        endTime: formatDateToLocal(endTime),
      };

      await axios.post(`${Constants.BASE_URL}/Device/UpsertDeviceLive`, requestBody);

      toast.success("Device data updated successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      setThreePhaseData(
        threePhaseData ? { ...threePhaseData, status } : null
      );

      if (status) {
        setGateValveDataList((prevList) =>
          prevList.map((device) =>
            device.defaultGV ? { ...device, status } : device
          )
        );
      }
    } catch (error) {
      console.error("Failed to update Device data:", error);
      toast.error("Failed to update device data", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const updateGatevalveData = async (
    imei: string,
    status: boolean,
    startTime: Date | null,
    endTime: Date | null
  ) => {
    if (!imei) {
      console.error("IMEI is missing");
      return;
    }

    try {
      const requestBody = {
        imei,
        status,
        starTime: formatDateToLocal(startTime),
        endTime: formatDateToLocal(endTime),
      };

      await axios.post(`${Constants.BASE_URL}/Device/UpsertDeviceLive`, requestBody);

      toast.success("Device data updated successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      setGateValveDataList((prevList) =>
        prevList.map((device) =>
          device.imei === imei ? { ...device, status } : device
        )
      );
    } catch (error) {
      console.error("Failed to update Device data:", error);
      toast.error("Failed to update device data", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const nextGateValve = () => {
    setCurrentGateValveIndex((prev) =>
      prev === gateValveDataList.length - 1 ? 0 : prev + 1
    );
  };

  const prevGateValve = () => {
    setCurrentGateValveIndex((prev) =>
      prev === 0 ? gateValveDataList.length - 1 : prev - 1
    );
  };

  const handleLogout = () => {
    navigate("/");
  };

  const activeDevice = selectedView === "tp" ? threePhaseData : currentGateValve;

  return (
    <div className="dashboard-container">
      <ToastContainer />
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading device data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          <section className="panel selector-panel">
            <div className="selector-top">
              <div className="welcome-block">
                <p className="welcome-label">Dashboard</p>
                <h2>Welcome, {loggedInUser || "Guest"}</h2>
              </div>
              <div className="logout-link">
                <button
                  onClick={() => navigate("/device-registration")}
                  style={{ cursor: "pointer" }}
                >
                  Device Registration
                </button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
            <h3>Select Device View</h3>
            <div className="view-toggle-grid">
              <button
                className={`view-card ${selectedView === "tp" ? "active" : ""}`}
                disabled={!threePhaseData}
                onClick={() => setSelectedView("tp")}
              >
                <span>3 Phase Motor</span>
                <small>{threePhaseData ? "Available" : "Not Available"}</small>
              </button>
              <button
                className={`view-card ${selectedView === "gv" ? "active" : ""}`}
                disabled={gateValveDataList.length === 0}
                onClick={() => setSelectedView("gv")}
              >
                <span>Gate Valve Motor</span>
                <small>
                  {gateValveDataList.length > 0
                    ? `${gateValveDataList.length} Device(s)`
                    : "Not Available"}
                </small>
              </button>
            </div>
          </section>

          {activeDevice && (
            <section className="panel status-row">
              <div className="status-card">
                <div className="status-head">
                  <FaBolt />
                  <p>Device Status</p>
                </div>
                <div className={`status-pill ${activeDevice.status ? "on" : "off"}`}>
                  <span className="status-dot"></span>
                  {activeDevice.status ? "Running" : "Stopped"}
                </div>
                <small style={{color:'gray'}} >
                  IMEI: <strong>{activeDevice.imei}</strong>
                </small>
              </div>

              <div className="battery-card">
                <div className="status-head">
                  <FaBatteryHalf />
                  <p>Battery</p>
                </div>
                <div className="battery-value">{activeDevice.battery}V</div>
                <span
                  className={`battery-chip ${
                    activeDevice.batStatus?.toLowerCase() === "low"
                      ? "low"
                      : "normal"
                  }`}
                >
                  {activeDevice.batStatus || "Unknown"}
                </span>
              </div>
            </section>
          )}

          {selectedView === "tp" && (
            <section className="panel device-panel">
              {threePhaseData ? (
                <>
                  <div className="device-title-row">
                    <h3>3 Phase Motor</h3>
                    <span className="imei-chip">IMEI: {threePhaseData.imei}</span>
                  </div>

                  <div className="icon-row">
                    <div className="icon-item">
                      <FaUser size={20} color="#7a4fe0" />
                      <p>Contact</p>
                    </div>
                    <div className="icon-item">
                      <FaMapMarkerAlt size={20} color="#ff8b2b" />
                      <p>Locate</p>
                    </div>
                    <div className="icon-item">
                      <FaThumbsUp size={20} color="#30b86a" />
                      <p>3 Phase</p>
                    </div>
                  </div>

                  <div className="device-image">
                    <img src={TP} alt="3 Phase Motor" height={150} />
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn start"
                      disabled={threePhaseData.status}
                      onClick={() =>
                        updateThreePhaseData(threePhaseData.imei, true, null, null)
                      }
                    >
                      Start
                    </button>
                    <button
                      className="action-btn stop"
                      disabled={!threePhaseData.status}
                      onClick={() =>
                        updateThreePhaseData(threePhaseData.imei, false, null, null)
                      }
                    >
                      Stop
                    </button>
                  </div>

                  <div className="date-time-grid">
                    <div className="date-picker-container">
                      <label>Start Time</label>
                      <DatePicker
                        selected={startDateTP}
                        onChange={(date) => setStartDateTP(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className="date-picker"
                      />
                    </div>
                    <div className="date-picker-container">
                      <label>Stop Time</label>
                      <DatePicker
                        selected={stopDateTP}
                        onChange={(date) => setStopDateTP(date)}
                        showTimeSelect
                        dateFormat="Pp"
                        className="date-picker"
                      />
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn set"
                      onClick={() =>
                        updateThreePhaseData(
                          threePhaseData.imei,
                          true,
                          startDateTP,
                          stopDateTP
                        )
                      }
                    >
                      Set Schedule
                    </button>
                  </div>
                </>
              ) : (
                <p>No Three Phase Motor Data Available</p>
              )}
            </section>
          )}

          {selectedView === "gv" && (
            <section className="panel device-panel">
              {gateValveDataList.length > 0 && currentGateValve ? (
                <>
                  <div className="device-title-row">
                    <h3>Gate Valve Motor</h3>
                    <span className="imei-chip">IMEI: {currentGateValve.imei}</span>
                  </div>

                  <div className="sub-controls">
                    <div className="toggle-switch">
                      <span className="toggle-label">Default Device</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={currentGateValve.defaultGV}
                          onChange={() =>
                            toggleDefaultGateValve(currentGateValve.imei)
                          }
                        />
                        <span className="slider-round"></span>
                      </label>
                    </div>

                    {gateValveDataList.length > 1 && (
                      <div className="carousel-controls">
                        <button className="carousel-button" onClick={prevGateValve}>
                          <span aria-hidden="true" className="arrow-glyph">
                            &#8249;
                          </span>
                        </button>
                        <span className="carousel-counter">
                          {currentGateValveIndex + 1}/{gateValveDataList.length}
                        </span>
                        <button className="carousel-button" onClick={nextGateValve}>
                          <span aria-hidden="true" className="arrow-glyph">
                            &#8250;
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="icon-row">
                    <div className="icon-item">
                      <FaUser size={20} color="#7a4fe0" />
                      <p>Contact</p>
                    </div>
                    <div className="icon-item">
                      <FaMapMarkerAlt size={20} color="#ff8b2b" />
                      <p>Locate</p>
                    </div>
                    <div className="icon-item">
                      <FaCheckCircle size={20} color="#30b86a" />
                      <p>Gate Valve</p>
                    </div>
                  </div>

                  <div className="device-image">
                    <img src={GV} alt="Gate Valve Motor" height={150} />
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn start"
                      disabled={currentGateValve.status}
                      onClick={() =>
                        updateGatevalveData(currentGateValve.imei, true, null, null)
                      }
                    >
                      Start
                    </button>
                    <button
                      className="action-btn stop"
                      disabled={!currentGateValve.status}
                      onClick={() =>
                        updateGatevalveData(currentGateValve.imei, false, null, null)
                      }
                    >
                      Stop
                    </button>
                  </div>

                  <div className="date-time-grid">
                    <div className="date-picker-container">
                      <label>Start Time</label>
                      <DatePicker
                        selected={
                          getGateValveDateSettings(currentGateValve.imei).startDate
                        }
                        onChange={(date) =>
                          updateGateValveDateSettings(
                            currentGateValve.imei,
                            "startDate",
                            date
                          )
                        }
                        showTimeSelect
                        dateFormat="Pp"
                        className="date-picker"
                      />
                    </div>
                    <div className="date-picker-container">
                      <label>Stop Time</label>
                      <DatePicker
                        selected={
                          getGateValveDateSettings(currentGateValve.imei).stopDate
                        }
                        onChange={(date) =>
                          updateGateValveDateSettings(
                            currentGateValve.imei,
                            "stopDate",
                            date
                          )
                        }
                        showTimeSelect
                        dateFormat="Pp"
                        className="date-picker"
                      />
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn set"
                      onClick={() =>
                        updateGatevalveData(
                          currentGateValve.imei,
                          true,
                          getGateValveDateSettings(currentGateValve.imei)
                            .startDate,
                          getGateValveDateSettings(currentGateValve.imei).stopDate
                        )
                      }
                    >
                      Set Schedule
                    </button>
                  </div>
                </>
              ) : (
                <p>No Gate Valve Data Available</p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
