import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Constants from "../Constants";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TP from "../assets/images/TP1.png";
import GV from "../assets/images/GV1.png";
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
  onLogout: () => void;
}

interface DeviceLiveData {
  imei: string;
  status: boolean | null;
  starTime: string;
  endTime: string;
  deviceType: number;
  defaultGV: boolean;
  battery: number;
  batStatus: string;
  rssi?: number | null;
  repeatSchedule?: boolean;
}

type DeviceView = "tp" | "gv";

const Dashboard: React.FC<DashboardProps> = ({ loggedInUser, onLogout }) => {
  const [startDateTP, setStartDateTP] = useState<Date | null>(new Date());
  const [stopDateTP, setStopDateTP] = useState<Date | null>(new Date());

  const [threePhaseData, setThreePhaseData] = useState<DeviceLiveData | null>(
    null,
  );
  const [gateValveDataList, setGateValveDataList] = useState<DeviceLiveData[]>(
    [],
  );

  const [selectedView, setSelectedView] = useState<DeviceView>("tp");
  const [currentGateValveIndex, setCurrentGateValveIndex] = useState(0);
  const [gateValveDateSettings, setGateValveDateSettings] = useState<{
    [key: string]: { startDate: Date | null; stopDate: Date | null };
  }>({});
  const [threePhaseRepeat, setThreePhaseRepeat] = useState(false);
  const [gateValveRepeatSettings, setGateValveRepeatSettings] = useState<{
    [key: string]: boolean;
  }>({});
  const [gateValveActionLoading, setGateValveActionLoading] = useState<{
    [imei: string]: "open" | "close" | null;
  }>({});

  const updateDeviceStatus = (imei: string, status: boolean) => {
    setThreePhaseData((prev) =>
      prev && prev.imei === imei ? { ...prev, status } : prev,
    );

    setGateValveDataList((prev) =>
      prev.map((device) =>
        device.imei === imei ? { ...device, status } : device,
      ),
    );
  };

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
    value: Date | null,
  ) => {
    setGateValveDateSettings((prev) => ({
      ...prev,
      [imei]: {
        ...getGateValveDateSettings(imei),
        [field]: value,
      },
    }));
  };

  const getGateValveRepeatSetting = (imei: string) =>
    gateValveRepeatSettings[imei] ?? false;

  const updateGateValveRepeatSetting = (imei: string, value: boolean) => {
    setGateValveRepeatSettings((prev) => ({
      ...prev,
      [imei]: value,
    }));
  };

  const parseServerDateAsUtc = useCallback((value: string | null | undefined): Date | null => {
    if (!value) return null;
    const normalized = /z$/i.test(value) ? value : `${value}Z`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const fetchLiveData = useCallback(async (showLoading = false) => {
    if (!loggedInUser) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await axios.get<DeviceLiveData[]>(
        `${Constants.BASE_URL}/Device/UserData/${loggedInUser}`,
      );

      if (response.data.length > 0) {
        const threePhaseDevice = response.data.find(
          (device) => device.deviceType === 1,
        );

        const gateValveDevices = response.data.filter(
          (device) => device.deviceType === 2,
        );

        setThreePhaseData(threePhaseDevice || null);
        setGateValveDataList(gateValveDevices);

        if (threePhaseDevice) {
          setStartDateTP(parseServerDateAsUtc(threePhaseDevice.starTime));
          setStopDateTP(parseServerDateAsUtc(threePhaseDevice.endTime));
          setThreePhaseRepeat(threePhaseDevice.repeatSchedule ?? false);
        }

        const dateSettings: {
          [key: string]: { startDate: Date | null; stopDate: Date | null };
        } = {};
        const repeatSettings: { [key: string]: boolean } = {};

        gateValveDevices.forEach((device) => {
          dateSettings[device.imei] = {
            startDate: parseServerDateAsUtc(device.starTime),
            stopDate: parseServerDateAsUtc(device.endTime),
          };
          repeatSettings[device.imei] = device.repeatSchedule ?? false;
        });

        setGateValveDateSettings(dateSettings);
        setGateValveRepeatSettings(repeatSettings);

        if (!threePhaseDevice && gateValveDevices.length > 0) {
          setSelectedView("gv");
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [loggedInUser, parseServerDateAsUtc]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isMounted) return;
      await fetchLiveData(true);
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [loggedInUser, fetchLiveData]);

  useEffect(() => {
    if (!loggedInUser) return;

    const intervalId = window.setInterval(() => {
      void fetchLiveData(false);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loggedInUser, fetchLiveData]);

  useEffect(() => {
    const eventSource = new EventSource(
      `${Constants.BASE_URL}/Device/StatusStream`,
    );

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.imei && typeof payload.status === "boolean") {
          updateDeviceStatus(payload.imei, payload.status);
        }
      } catch (error) {
        console.error("Failed to parse status stream event", error);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

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

  const formatDateToUtc = (date: Date | null) => {
    if (!date) return null;
    return date.toISOString();
  };

  const updateThreePhaseData = async (
    imei: string,
    status: boolean | null,
    startTime: Date | null,
    endTime: Date | null,
    repeat: boolean,
  ) => {
    if (!imei) {
      console.error("IMEI is missing");
      return;
    }

    try {
      const requestBody = {
        imei,
        status,
        starTime: formatDateToUtc(startTime),
        endTime: formatDateToUtc(endTime),
        repeatSchedule: repeat,
      };

      await axios.post(
        `${Constants.BASE_URL}/Device/UpsertDeviceLive`,
        requestBody,
      );

      toast.success("Device data updated successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      setThreePhaseData(
        threePhaseData
          ? { ...threePhaseData, status, repeatSchedule: repeat }
          : null,
      );
      setThreePhaseRepeat(repeat);

      if (status) {
        setGateValveDataList((prevList) =>
          prevList.map((device) =>
            device.defaultGV ? { ...device, status } : device,
          ),
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
    status: boolean | null,
    startTime: Date | null,
    endTime: Date | null,
    repeat: boolean,
  ) => {
    if (!imei) {
      console.error("IMEI is missing");
      return;
    }

    try {
      const requestBody = {
        imei,
        status,
        startTime: formatDateToUtc(startTime),
        endTime: formatDateToUtc(endTime),
        repeatSchedule: repeat,
      };

      await axios.post(
        `${Constants.BASE_URL}/Device/UpsertDeviceLive`,
        requestBody,
      );

      toast.success("Device data updated successfully!", {
        position: "top-right",
        autoClose: 2000,
      });

      setGateValveDataList((prevList) =>
        prevList.map((device) =>
          device.imei === imei
            ? { ...device, status, repeatSchedule: repeat }
            : device,
        ),
      );
      setGateValveRepeatSettings((prev) => ({
        ...prev,
        [imei]: repeat,
      }));
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
      prev === gateValveDataList.length - 1 ? 0 : prev + 1,
    );
  };

  const prevGateValve = () => {
    setCurrentGateValveIndex((prev) =>
      prev === 0 ? gateValveDataList.length - 1 : prev - 1,
    );
  };

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  const activeDevice =
    selectedView === "tp" ? threePhaseData : currentGateValve;

  const sendGateValveCommand = async (
    imei: string,
    action: "open" | "close",
  ) => {
    if (!imei) return;

    setGateValveActionLoading((prev) => ({ ...prev, [imei]: action }));

    try {
      await axios.post(`${Constants.BASE_URL}/Device/PublishGateValveCommand`, {
        imei,
        status: action === "open",
      });

      toast.success(
        action === "open" ? "Opening gate valve..." : "Closing gate valve...",
      );
    } catch (error) {
      console.error("Failed to send gate valve command: ", error);
      toast.error("Failed to send gate valve command", {
        position: "top-right",
        autoClose: 2000,
      });
    } finally {
      setGateValveActionLoading((prev) => ({ ...prev, [imei]: null }));
    }
  };

  // const updateGateValveTempStatus = async (imei: string, status: boolean) => {
  //   if (!imei) return;

  //   try {
  //     await axios.post(`${Constants.BASE_URL}/Device/UpsertDeviceLive`, {
  //       imei,
  //       status,
  //       startTime: null,
  //       endTime: null,
  //       repeatSchedule: getGateValveRepeatSetting(imei),
  //     });

  //     setGateValveDataList((prevList) =>
  //       prevList.map((device) =>
  //         device.imei === imei ? { ...device, status } : device,
  //       ),
  //     );

  //     toast.success(status ? "Temp Open applied" : "Temp Close applied", {
  //       position: "top-right",
  //       autoClose: 2000,
  //     });
  //   } catch (error) {
  //     console.error("Failed to update temp gate valve status:", error);
  //     toast.error("Failed to update temp gate valve status", {
  //       position: "top-right",
  //       autoClose: 2000,
  //     });
  //   }
  // };

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
                <div
                  className={`status-pill ${activeDevice.status ? "on" : "off"}`}
                >
                  <span className="status-dot"></span>
                  {activeDevice.status ? "Running" : "Stopped"}
                </div>
                <small style={{ color: "gray" }}>
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
                      ? "Low"
                      : "Good"
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
                    <span className="imei-chip">
                      IMEI: {threePhaseData.imei}
                    </span>
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
                      disabled={threePhaseData.status ?? false}
                      onClick={() =>
                        updateThreePhaseData(
                          threePhaseData.imei,
                          true,
                          null,
                          null,
                          threePhaseRepeat,
                        )
                      }
                    >
                      Start
                    </button>
                    <button
                      className="action-btn stop"
                      disabled={!(threePhaseData.status ?? false)}
                      onClick={() =>
                        updateThreePhaseData(
                          threePhaseData.imei,
                          false,
                          null,
                          null,
                          threePhaseRepeat,
                        )
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

                  <div className="repeat-control">
                    <label>
                      <input
                        type="checkbox"
                        checked={threePhaseRepeat}
                        onChange={(event) =>
                          setThreePhaseRepeat(event.target.checked)
                        }
                      />
                      Repeat ON/OFF schedule
                    </label>
                  </div>

                  <div className="card-actions">
                    <button
                      className="action-btn set"
                      onClick={() =>
                        updateThreePhaseData(
                          threePhaseData.imei,
                          null,
                          startDateTP,
                          stopDateTP,
                          threePhaseRepeat,
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
                  {(() => {
                    const actionLoading =
                      gateValveActionLoading[currentGateValve.imei];
                    const isCommandPending =
                      actionLoading === "open" || actionLoading === "close";

                    return (
                      <>
                        <div className="device-title-row">
                          <h3>Gate Valve Motor</h3>
                          <span className="imei-chip">
                            IMEI: {currentGateValve.imei}
                          </span>
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
                              <button
                                className="carousel-button"
                                onClick={prevGateValve}
                              >
                                <span
                                  aria-hidden="true"
                                  className="arrow-glyph"
                                >
                                  &#8249;
                                </span>
                              </button>
                              <span className="carousel-counter">
                                {currentGateValveIndex + 1}/
                                {gateValveDataList.length}
                              </span>
                              <button
                                className="carousel-button"
                                onClick={nextGateValve}
                              >
                                <span
                                  aria-hidden="true"
                                  className="arrow-glyph"
                                >
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
                            disabled={
                              isCommandPending ||
                              (currentGateValve.status ?? false)
                            }
                            onClick={() =>
                              sendGateValveCommand(
                                currentGateValve.imei,
                                "open",
                              )
                            }
                          >
                            {actionLoading === "open" ? "Opening..." : "Open"}
                          </button>
                          <button
                            className="action-btn stop"
                            disabled={
                              isCommandPending ||
                              !(currentGateValve.status ?? false)
                            }
                            onClick={() =>
                              sendGateValveCommand(
                                currentGateValve.imei,
                                "close",
                              )
                            }
                          >
                            {actionLoading === "close" ? "Closing..." : "Close"}
                          </button>
                          {/* <div className="card-actions">
                            <button
                              className="action-btn start"
                              onClick={() =>
                                updateGateValveTempStatus(
                                  currentGateValve.imei,
                                  true,
                                )
                              }
                            >
                              TempOpen
                            </button>

                            <button
                              className="action-btn stop"
                              onClick={() =>
                                updateGateValveTempStatus(
                                  currentGateValve.imei,
                                  false,
                                )
                              }
                            >
                              TempClose
                            </button>
                          </div> */}
                        </div>

                        <div className="date-time-grid">
                          <div className="date-picker-container">
                            <label>Start Time</label>
                            <DatePicker
                              selected={
                                getGateValveDateSettings(currentGateValve.imei)
                                  .startDate
                              }
                              onChange={(date) =>
                                updateGateValveDateSettings(
                                  currentGateValve.imei,
                                  "startDate",
                                  date,
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
                                getGateValveDateSettings(currentGateValve.imei)
                                  .stopDate
                              }
                              onChange={(date) =>
                                updateGateValveDateSettings(
                                  currentGateValve.imei,
                                  "stopDate",
                                  date,
                                )
                              }
                              showTimeSelect
                              dateFormat="Pp"
                              className="date-picker"
                            />
                          </div>
                        </div>

                        <div className="repeat-control">
                          <label>
                            <input
                              type="checkbox"
                              checked={getGateValveRepeatSetting(
                                currentGateValve.imei,
                              )}
                              onChange={(event) =>
                                updateGateValveRepeatSetting(
                                  currentGateValve.imei,
                                  event.target.checked,
                                )
                              }
                            />
                            Repeat ON/OFF schedule
                          </label>
                        </div>

                        <div className="card-actions">
                          <button
                            className="action-btn set"
                            onClick={() =>
                              updateGatevalveData(
                                currentGateValve.imei,
                                null,
                                getGateValveDateSettings(currentGateValve.imei)
                                  .startDate,
                                getGateValveDateSettings(currentGateValve.imei)
                                  .stopDate,
                                getGateValveRepeatSetting(
                                  currentGateValve.imei,
                                ),
                              )
                            }
                          >
                            Set Schedule
                          </button>
                        </div>
                      </>
                    );
                  })()}
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
