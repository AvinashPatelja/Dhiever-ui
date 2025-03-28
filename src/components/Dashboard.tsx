import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Constants from '../Constants';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TP from '/src/assets/images/3TP.png';
import GV from '/src/assets/images/GV.png';
import { FaUser, FaMapMarkerAlt, FaThumbsUp, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
}

const Dashboard: React.FC<DashboardProps> = ({ loggedInUser }) => {
  const [startDateTP, setStartDateTP] = useState<Date | null>(new Date());
  const [stopDateTP, setStopDateTP] = useState<Date | null>(new Date());

  const [threePhaseData, setThreePhaseData] = useState<DeviceLiveData | null>(null);
  const [gateValveDataList, setGateValveDataList] = useState<DeviceLiveData[]>([]);

  // For managing carousel
  const [currentGateValveIndex, setCurrentGateValveIndex] = useState(0);
  const [gateValveDateSettings, setGateValveDateSettings] = useState<{ [key: string]: { startDate: Date | null, stopDate: Date | null } }>({});

  // Loading state
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Get current gate valve device and its date settings
  const currentGateValve = gateValveDataList[currentGateValveIndex] || null;

  const getGateValveDateSettings = (imei: string) => {
    if (!gateValveDateSettings[imei]) {
      return { startDate: new Date(), stopDate: new Date() };
    }
    return gateValveDateSettings[imei];
  };

  const updateGateValveDateSettings = (imei: string, field: 'startDate' | 'stopDate', value: Date | null) => {
    setGateValveDateSettings(prev => ({
      ...prev,
      [imei]: {
        ...getGateValveDateSettings(imei),
        [field]: value
      }
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true); // Start loading
      try {
        const response = await axios.get<DeviceLiveData[]>(`${Constants.BASE_URL}/Device/UserData/${loggedInUser}`);
        console.log('API Response:', response.data);

        if (isMounted && response.data.length > 0) {
          // Find the three phase device
          const threePhaseDevice = response.data.find(device => device.deviceType === 1);

          // Find all gate valve devices
          const gateValveDevices = response.data.filter(device => device.deviceType === 2);

          setThreePhaseData(threePhaseDevice || null);
          setGateValveDataList(gateValveDevices);

          if (threePhaseDevice) {
            setStartDateTP(new Date(threePhaseDevice.starTime));
            setStopDateTP(new Date(threePhaseDevice.endTime));
          }

          // Initialize date settings for each gate valve
          const dateSettings: { [key: string]: { startDate: Date | null, stopDate: Date | null } } = {};
          gateValveDevices.forEach(device => {
            dateSettings[device.imei] = {
              startDate: new Date(device.starTime),
              stopDate: new Date(device.endTime)
            };
          });
          setGateValveDateSettings(dateSettings);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false); // Stop loading after data is fetched
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle Default Gate Valve
  const toggleDefaultGateValve = async (imei: string) => {
    try {
      const updatedGateValves = gateValveDataList.map(device => ({
        ...device,
        defaultGV: device.imei === imei ? !device.defaultGV : false
      }));

      await axios.post(`${Constants.BASE_URL}/Device/UpdateDefaultGV`, { imei });

      setGateValveDataList(updatedGateValves);

      toast.success('Default Gate Valve Updated', { position: "top-right", autoClose: 2000 });
    } catch (error) {
      console.error('Failed to update default gate valve:', error);
      toast.error('Failed to update default gate valve', { position: "top-right", autoClose: 2000 });
    }
  };

  // Function to send API request for updating device data
  const formatDateToLocal = (date: Date | null) => {
    if (!date) return null;

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);

    return localDate.toISOString().replace('Z', '');
  };

  const updateThreePhaseData = async (imei: string, status: boolean, startTime: Date | null, endTime: Date | null) => {
    if (!imei) {
      console.error('IMEI is missing');
      return;
    }

    try {
      const requestBody = {
        imei: imei,
        status: status,
        starTime: formatDateToLocal(startTime),
        endTime: formatDateToLocal(endTime),
      };

      await axios.post(`${Constants.BASE_URL}/Device/UpsertDeviceLive`, requestBody);

      toast.success('Device data updated successfully!', { position: "top-right", autoClose: 2000 });

      setThreePhaseData(threePhaseData ? { ...threePhaseData, status: status } : null);
      //setGateValveDataList(gateValveDataList?gateValveDataList.map(data => ({ ...data, status: status })) : []);

      // Update only the gate valve with defaultGV: true
      if (status) {
        setGateValveDataList((prevList) =>
          prevList.map((device) =>
            device.defaultGV ? { ...device, status: status } : device
          )
        );
      }

      console.log('Device data updated successfully');
    } catch (error) {
      console.error('Failed to update Device data:', error);
      toast.error('Failed to update device data', { position: "top-right", autoClose: 2000 });
    }
  };

  const updateGatevalveData = async (imei: string, status: boolean, startTime: Date | null, endTime: Date | null) => {
    if (!imei) {
      console.error('IMEI is missing');
      return;
    }

    try {
      const requestBody = {
        imei: imei,
        status: status,
        starTime: formatDateToLocal(startTime),
        endTime: formatDateToLocal(endTime),
      };

      console.log('Sending API Request:', requestBody);

      await axios.post(`${Constants.BASE_URL}/Device/UpsertDeviceLive`, requestBody);

      toast.success('Device data updated successfully!', { position: "top-right", autoClose: 2000 });

      // Update the status of the specific gate valve
      setGateValveDataList(prevList =>
        prevList.map(device =>
          device.imei === imei ? { ...device, status } : device
        )
      );

      console.log('Gate valve data updated successfully');
    } catch (error) {
      console.error('Failed to update Device data:', error);
      toast.error('Failed to update device data', { position: "top-right", autoClose: 2000 });
    }
  };

  const nextGateValve = () => {
    setCurrentGateValveIndex(prev =>
      prev === gateValveDataList.length - 1 ? 0 : prev + 1
    );
  };

  const prevGateValve = () => {
    setCurrentGateValveIndex(prev =>
      prev === 0 ? gateValveDataList.length - 1 : prev - 1
    );
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <ToastContainer /> {/* Toast notifications container */}
      <header className="dashboard-header">
        <div className="welcome-message">
          Welcome, <strong>{loggedInUser || 'Guest'}</strong>
        </div>
        <div className="logout-link">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Show loading indicator while fetching data */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading device data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {/* 3 Phase Motor Card */}
          {threePhaseData ? (
            <div className="card">
              <h3>3 Phase Motor</h3>;
              <span className="carousel-counter" style={{ color: '#027368', fontWeight: 'bold' }}>
                IMEI: {threePhaseData.imei}
              </span>
              <div className="card-body">
                <div className="icon-row">
                  <div className="icon-item">
                    <FaUser size={24} color="#027368" />
                    <p>Contact</p>
                  </div>
                  <div className="icon-item">
                    <FaMapMarkerAlt size={24} color="#ff5722" />
                    <p>Locate</p>
                  </div>
                  <div className="icon-item">
                    <FaThumbsUp size={24} color="#4caf50" />
                    <p>3 Phase</p>
                  </div>
                </div>
                <div className="device-image">
                  <img src={TP} alt="3TP" height={150} />
                </div>
                <div className="card-actions">
                  <button
                    disabled={threePhaseData.status}
                    onClick={() => updateThreePhaseData(threePhaseData.imei, true, null, null)}
                  >
                    Start
                  </button>
                  <button
                    disabled={!threePhaseData.status}
                    onClick={() => updateThreePhaseData(threePhaseData.imei, false, null, null)}
                  >
                    Stop
                  </button>
                </div>
                <div className="date-picker-container">
                  <label>Start Time:</label>
                  <DatePicker
                    selected={startDateTP}
                    onChange={(date) => setStartDateTP(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="date-picker"
                  />
                </div>
                <div className="date-picker-container">
                  <label>Stop Time:</label>
                  <DatePicker
                    selected={stopDateTP}
                    onChange={(date) => setStopDateTP(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    className="date-picker"
                  />
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => updateThreePhaseData(threePhaseData.imei, true, startDateTP, stopDateTP)}
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          ) : <p>Loading Three Phase Data...</p>}

          {/* Gate Valve Motor Cards - Carousel */}
          {gateValveDataList.length > 0 ? (
            <div className="card">
              <h3>Gate Valve Motor

                {gateValveDataList.length === 1 ? (
                  <span className="carousel-counter">
                    <div className="device-imei">
                      IMEI: {currentGateValve.imei}
                    </div>
                  </span>
                ) : gateValveDataList.length > 1 && (
                  <span className="carousel-counter">
                    ({currentGateValveIndex + 1}/{gateValveDataList.length})
                    <div className="device-imei">
                      IMEI: {currentGateValve.imei}
                    </div>
                  </span>
                )}
              </h3>

              {/* Toggle Default Button */}
              {currentGateValve && (
                <div className="toggle-switch">
                  <span className="toggle-label">Default</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={currentGateValve.defaultGV}
                      onChange={() => toggleDefaultGateValve(currentGateValve.imei)}
                    />
                    <span className="slider-round"></span>
                  </label>
                </div>
              )}

              {gateValveDataList.length > 1 && (
                <div className="device-header">
                  <button className="carousel-button" onClick={prevGateValve}>
                    <FaChevronLeft />
                  </button>
                  <button className="carousel-button" onClick={nextGateValve}>
                    <FaChevronRight />
                  </button>
                </div>
              )}

              {currentGateValve && (
                <div className="card-body">
                  <div className="icon-row">
                    <div className="icon-item">
                      <FaUser size={24} color="#027368" />
                      <p>Contact</p>
                    </div>
                    <div className="icon-item">
                      <FaMapMarkerAlt size={24} color="#ff5722" />
                      <p>Locate</p>
                    </div>

                  </div>
                  <div className="device-image">
                    <img src={GV} alt="Gate Valve Motor" height={150} />
                  </div>
                  <div className="card-actions">
                    <button
                      disabled={currentGateValve.status}
                      onClick={() => updateGatevalveData(currentGateValve.imei, true, null, null)}
                    >
                      Start
                    </button>
                    <button
                      disabled={!currentGateValve.status}
                      onClick={() => updateGatevalveData(currentGateValve.imei, false, null, null)}
                    >
                      Stop
                    </button>
                  </div>
                  <div className="date-picker-container">
                    <label>Start Time:</label>
                    <DatePicker
                      selected={getGateValveDateSettings(currentGateValve.imei).startDate}
                      onChange={(date) => updateGateValveDateSettings(currentGateValve.imei, 'startDate', date)}
                      showTimeSelect
                      dateFormat="Pp"
                      className="date-picker"
                    />
                  </div>
                  <div className="date-picker-container">
                    <label>Stop Time:</label>
                    <DatePicker
                      selected={getGateValveDateSettings(currentGateValve.imei).stopDate}
                      onChange={(date) => updateGateValveDateSettings(currentGateValve.imei, 'stopDate', date)}
                      showTimeSelect
                      dateFormat="Pp"
                      className="date-picker"
                    />
                  </div>
                  <div className="card-actions">
                    <button
                      onClick={() => updateGatevalveData(
                        currentGateValve.imei,
                        true,
                        getGateValveDateSettings(currentGateValve.imei).startDate,
                        getGateValveDateSettings(currentGateValve.imei).stopDate
                      )}
                    >
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>No Gate Valve Data Available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;