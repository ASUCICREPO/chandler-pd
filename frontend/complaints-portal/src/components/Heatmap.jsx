import React, { useEffect, useRef, useState } from "react";
import { loadModules } from "esri-loader";
import { beatsData } from "../beatsData/beats";
import CustomBeatPopup from "./CustomBeatPopup"; // Import the custom popup component

// // Apply counts directly to your beats layer
// beatsData.features.forEach((feature) => {
//   const beatId = feature.attributes.POLICE_BEAT;
//   // Use complaintsData directly since it's already in the right format
//   // If the beat ID exists in complaintsData, use that count; otherwise, use 0
//   feature.attributes.COMPLAINT_COUNT = complaintsData[beatId] || 0;
// });
const API_URL = import.meta.env.VITE_API_URL;

const PoliceBeatsMap = () => {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);
  const [beatsLayer, setBeatsLayer] = useState(null);
  const [currentBasemap, setCurrentBasemap] = useState("streets");
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [complaintsData, setComplaintsData] = useState({});

  // Fetch complaints data from API
  useEffect(() => {
    const fetchComplaintsData = async () => {
      setLoading(true);
      try {
        // Replace with actual API endpoint from one of the available police API services
        // For example, using the Police API Client or DOJ Crime Data API
        const response = await fetch(API_URL + "/Development/beat-open-cases");
        const data = await response.json();

        setComplaintsData(data.body);
      } catch (error) {
        console.error("Error fetching complaints data:", error);
        // Fallback to default data if API fails
        setComplaintsData({
          1: 10,
          2: 66,
          3: 88,
          4: 89,
          5: 19,
          7: 19,
        });
      }
    };

    fetchComplaintsData();
  }, []);
  useEffect(() => {
    if (!beatsData.features) return; // Wait until data is loaded
    setLoading(true);
    // Apply counts to beats layer once both data are available
    beatsData.features.forEach((feature) => {
      const beatId = feature.attributes.POLICE_BEAT;
      feature.attributes.COMPLAINT_COUNT = complaintsData[beatId] || 0;
    });

    setLoading(true);
    // Load ArcGIS modules with additional components for enhanced visualization
    loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/geometry/SpatialReference", "esri/renderers/SimpleRenderer", "esri/symbols/SimpleFillSymbol", "esri/widgets/Legend", "esri/widgets/Home", "esri/widgets/Search", "esri/widgets/ScaleBar", "esri/widgets/BasemapGallery", "esri/widgets/Expand", "esri/geometry/Extent", "esri/widgets/Feature"], { css: true })
      .then(([Map, MapView, FeatureLayer, SpatialReference, SimpleRenderer, SimpleFillSymbol, Legend, Home, Search, ScaleBar, BasemapGallery, Expand, Extent, Feature]) => {
        // Create map with a more professional basemap
        const map = new Map({
          basemap: currentBasemap, // More subtle basemap for professional visualization
        });

        // Define Arizona extent to restrict panning
        const phoenixAndChandlerExtent = new Extent({
          xmin: -112.5, // Extended westward to include Phoenix
          ymin: 33.0, // Adjusted to include more of the Phoenix metro area
          xmax: -111.0, // Eastern boundary still covers Chandler
          ymax: 33.9, // Northern boundary includes north Phoenix
          spatialReference: { wkid: 4326 },
        });

        // Create map view with improved configuration
        const mapView = new MapView({
          container: mapRef.current,
          map: map,
          center: [-111.8413, 33.3015], // Approximate center of Chandler, AZ
          zoom: 12, // Zoomed out to see entire Chandler area
          constraints: {
            snapToZoom: true,
            rotationEnabled: false,
            minZoom: 11,
            maxZoom: 20,
            geometry: phoenixAndChandlerExtent, // Restrict pan to Arizona
            minScale: 4000000, // Approximately covers all of Arizona
            maxScale: 1000, // Close zoom limit
          },
          popup: {
            dockEnabled: false,
            autoOpenEnabled: false, // Disable default popups
          },
          ui: {
            components: ["attribution"], // Only keep attribution and add others later
          },
        });
        setView(mapView);

        // Add loading indicator
        mapView.when(() => {
          setLoading(false);
        });

        // Calculate min and max complaints for color scaling
        const complaintValues = Object.values(complaintsData);
        const minComplaints = Math.min(...complaintValues);
        const maxComplaints = Math.max(...complaintValues);

        // Helper function to categorize complaint levels
        function getComplaintLevel(count, min, max) {
          if (count === 0) return "None";
          const range = max - min;
          if (count < min + range * 0.2) return "Very Low";
          if (count < min + range * 0.4) return "Low";
          if (count < min + range * 0.6) return "Medium";
          if (count < min + range * 0.8) return "High";
          return "Very High";
        }

        // Transform beats data into features, including complaint counts
        const features = beatsData.features.map((beat) => {
          const beatNumber = beat.attributes.POLICE_BEAT;
          const complaintCount = complaintsData[beatNumber] || 0;

          return {
            geometry: {
              type: "polygon",
              rings: beat.geometry.rings,
              spatialReference: { wkid: 2223 }, // Arizona State Plane Central (feet)
            },
            attributes: {
              OBJECTID: beat.attributes.OBJECTID,
              POLICE_BEAT: beat.attributes.POLICE_BEAT,
              DISTRICT: beat.attributes.POLICE_DISTRICT,
              COMPLAINT_COUNT: complaintCount,
              COMPLAINT_LEVEL: getComplaintLevel(complaintCount, minComplaints, maxComplaints),
            },
          };
        });

        // New color scheme based on the provided image
        // Using colors from bright green to bright red
        const renderer = new SimpleRenderer({
          symbol: new SimpleFillSymbol({
            style: "solid",
            outline: {
              color: [100, 100, 100, 0.8],
              width: 0.75,
            },
          }),
          visualVariables: [
            {
              type: "color",
              field: "COMPLAINT_COUNT",
              legendOptions: {
                title: "Complaint Heat Map",
              },
              stops: [
                { value: 0, color: [0, 255, 0, 0.8], label: "None" }, // Bright green
                { value: minComplaints, color: [144, 238, 0, 0.8], label: "Very Low" }, // Yellow-green
                { value: minComplaints + (maxComplaints - minComplaints) * 0.25, color: [255, 255, 0, 0.8], label: "Low" }, // Yellow
                { value: minComplaints + (maxComplaints - minComplaints) * 0.5, color: [255, 165, 0, 0.8], label: "Medium" }, // Orange
                { value: minComplaints + (maxComplaints - minComplaints) * 0.75, color: [255, 69, 0, 0.8], label: "High" }, // Red-orange
                { value: maxComplaints, color: [255, 0, 0, 0.9], label: "Very High" }, // Bright red
              ],
            },
            {
              type: "opacity",
              valueExpression: "$feature.COMPLAINT_COUNT",
              stops: [
                { value: 0, opacity: 0.7 },
                { value: maxComplaints, opacity: 0.9 },
              ],
            },
          ],
        });

        // Create police beats layer with enhanced configurations
        const beatsFeatLayer = new FeatureLayer({
          source: features,
          title: "Police Beats Complaint Density",
          objectIdField: "OBJECTID",
          geometryType: "polygon",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "POLICE_BEAT", type: "string" },
            { name: "DISTRICT", type: "integer" },
            { name: "COMPLAINT_COUNT", type: "integer" },
            { name: "COMPLAINT_LEVEL", type: "string" },
          ],
          renderer: renderer,
          popupEnabled: false, // Disable default popups
          labelingInfo: [
            {
              labelExpressionInfo: { expression: "$feature.POLICE_BEAT" },
              symbol: {
                type: "text",
                color: [0, 0, 0, 0.8],
                haloColor: [255, 255, 255, 0.8],
                haloSize: 1.5,
                font: {
                  size: 11,
                  family: "Arial",
                  weight: "bold",
                },
              },
              labelPlacement: "always-horizontal",
              minScale: 350000,
            },
          ],
          minScale: 350000,
          opacity: 0.9,
        });

        setBeatsLayer(beatsFeatLayer);

        // Add click event to handle custom popup
        mapView.on("click", (event) => {
          // Clear existing popup
          setSelectedBeat(null);

          // Hit test to check if a beat was clicked
          mapView.hitTest(event).then((response) => {
            // Find features from the beats layer
            const beatFeature = response.results.find((result) => result.graphic && result.graphic.layer === beatsFeatLayer);

            if (beatFeature) {
              // Store the clicked beat and position for popup
              setSelectedBeat(beatFeature.graphic);
              setPopupPosition({
                x: event.screenPoint.x,
                y: event.screenPoint.y,
              });
            }
          });
        });

        // Close popup when clicking elsewhere on the map
        mapView.on("immediate-click", (event) => {
          // Hit test to check if click was not on a beat
          mapView.hitTest(event).then((response) => {
            const beatFeature = response.results.find((result) => result.graphic && result.graphic.layer === beatsFeatLayer);

            if (!beatFeature) {
              setSelectedBeat(null);
            }
          });
        });

        // Modified beats outline layer with thicker, more visible borders
        const beatsOutlineLayer = new FeatureLayer({
          source: beatsData.features.map((beat) => ({
            geometry: {
              type: "polygon",
              rings: beat.geometry.rings,
              spatialReference: { wkid: 2223 },
            },
            attributes: {
              OBJECTID: beat.attributes.OBJECTID,
              POLICE_BEAT: beat.attributes.POLICE_BEAT,
            },
          })),
          title: "Police Beat Boundaries",
          objectIdField: "OBJECTID",
          geometryType: "polygon",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "POLICE_BEAT", type: "string" },
          ],
          renderer: new SimpleRenderer({
            symbol: new SimpleFillSymbol({
              style: "none",
              outline: {
                color: [50, 50, 50, 0.9],
                width: 1.75,
              },
            }),
          }),
          labelingInfo: [
            {
              labelExpressionInfo: { expression: "$feature.POLICE_BEAT" },
              symbol: {
                type: "text",
                color: [20, 20, 20, 1],
                haloColor: [255, 255, 255, 0.9],
                haloSize: 2,
                font: {
                  size: 12,
                  family: "Arial",
                  weight: "bold",
                },
              },
              labelPlacement: "always-horizontal",
              minScale: 350000,
            },
          ],
          minScale: 350000,
          maxScale: 0,
        });

        // Add layers to map
        map.addMany([beatsFeatLayer, beatsOutlineLayer]);

        // Create a custom Legend that is interactive
        const customLegendDiv = document.createElement("div");
        customLegendDiv.className = "esri-widget custom-legend";
        customLegendDiv.style.padding = "10px";
        customLegendDiv.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
        customLegendDiv.style.margin = "10px";
        customLegendDiv.style.borderRadius = "5px";
        customLegendDiv.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.2)";
        customLegendDiv.style.maxWidth = "250px";

        // Legend title
        const legendTitle = document.createElement("div");
        legendTitle.style.fontWeight = "bold";
        legendTitle.style.fontSize = "14px";
        legendTitle.style.marginBottom = "8px";
        legendTitle.style.borderBottom = "1px solid #ccc";
        legendTitle.style.paddingBottom = "5px";
        legendTitle.textContent = "Complaint Heat Map by Police Beat";
        customLegendDiv.appendChild(legendTitle);

        // Create legend items
        const legendItems = [
          { label: "None", color: "rgb(0, 255, 0)", level: "None" },
          { label: "Very Low", color: "rgb(144, 238, 0)", level: "Very Low" },
          { label: "Low", color: "rgb(255, 255, 0)", level: "Low" },
          { label: "Medium", color: "rgb(255, 165, 0)", level: "Medium" },
          { label: "High", color: "rgb(255, 69, 0)", level: "High" },
          { label: "Very High", color: "rgb(255, 0, 0)", level: "Very High" },
        ];

        legendItems.forEach((item) => {
          const legendItem = document.createElement("div");
          legendItem.style.display = "flex";
          legendItem.style.alignItems = "center";
          legendItem.style.margin = "5px 0";
          legendItem.style.cursor = "pointer";
          legendItem.setAttribute("data-level", item.level);
          legendItem.classList.add("legend-item");

          const colorBox = document.createElement("div");
          colorBox.style.width = "20px";
          colorBox.style.height = "20px";
          colorBox.style.backgroundColor = item.color;
          colorBox.style.marginRight = "10px";
          colorBox.style.border = "1px solid #999";

          const labelDiv = document.createElement("div");
          labelDiv.textContent = item.label;

          legendItem.appendChild(colorBox);
          legendItem.appendChild(labelDiv);
          customLegendDiv.appendChild(legendItem);

          // Add click handler to filter the map when legend item is clicked
          legendItem.addEventListener("click", function () {
            const level = this.getAttribute("data-level");

            // Highlight this item in the legend
            document.querySelectorAll(".legend-item").forEach((el) => {
              el.style.backgroundColor = "transparent";
              el.style.fontWeight = "normal";
            });
            this.style.backgroundColor = "#f0f0f0";
            this.style.fontWeight = "bold";

            // Create a definition expression to filter the beats layer
            if (level === "All") {
              beatsFeatLayer.definitionExpression = "";
            } else {
              beatsFeatLayer.definitionExpression = `COMPLAINT_LEVEL = '${level}'`;
            }

            // Close popup when changing filters
            setSelectedBeat(null);
          });
        });

        // Add "Show All" option
        const showAllItem = document.createElement("div");
        showAllItem.style.display = "flex";
        showAllItem.style.alignItems = "center";
        showAllItem.style.margin = "10px 0 5px 0";
        showAllItem.style.cursor = "pointer";
        showAllItem.setAttribute("data-level", "All");
        showAllItem.classList.add("legend-item");
        showAllItem.style.borderTop = "1px solid #ccc";
        showAllItem.style.paddingTop = "5px";
        showAllItem.style.backgroundColor = "#f0f0f0";
        showAllItem.style.fontWeight = "bold";

        const allLabel = document.createElement("div");
        allLabel.textContent = "Show All Beats";
        allLabel.style.marginLeft = "5px";

        showAllItem.appendChild(allLabel);
        customLegendDiv.appendChild(showAllItem);

        showAllItem.addEventListener("click", function () {
          document.querySelectorAll(".legend-item").forEach((el) => {
            el.style.backgroundColor = "transparent";
            el.style.fontWeight = "normal";
          });
          this.style.backgroundColor = "#f0f0f0";
          this.style.fontWeight = "bold";

          // Reset the definition expression
          beatsFeatLayer.definitionExpression = "";

          // Close popup when changing filters
          setSelectedBeat(null);
        });

        // Add home button widget
        const homeBtn = new Home({
          view: mapView,
        });

        // Add search widget
        const searchWidget = new Search({
          view: mapView,
          popupEnabled: false, // Disable default popups
          searchAllEnabled: false,
          includeDefaultSources: false,
          sources: [
            {
              layer: beatsFeatLayer,
              searchFields: ["POLICE_BEAT"],
              displayField: "POLICE_BEAT",
              exactMatch: false,
              outFields: ["*"],
              name: "Police Beat",
              placeholder: "Search Beat #",
            },
          ],
        });

        // Handle search widget selection to show custom popup
        searchWidget.on("select-result", (event) => {
          if (event.result && event.result.feature) {
            const feature = event.result.feature;
            setSelectedBeat(feature);

            // Get the center point of the beat for popup positioning
            mapView.whenLayerView(beatsFeatLayer).then((layerView) => {
              // Check if the feature has a valid extent
              if (feature.geometry && feature.geometry.extent) {
                // Get the center of the polygon
                const center = feature.geometry.extent.center;
                // Convert the map point to screen coordinates
                const screenPoint = mapView.toScreen(center);
                setPopupPosition({
                  x: screenPoint.x,
                  y: screenPoint.y,
                });
              }
            });
          }
        });

        // Add scale bar
        const scaleBar = new ScaleBar({
          view: mapView,
          unit: "dual",
        });

        // Add basemap gallery in an expandable widget
        const basemapGallery = new BasemapGallery({
          view: mapView,
        });

        const bgExpand = new Expand({
          view: mapView,
          content: basemapGallery,
          expandIconClass: "esri-icon-basemap",
          expandTooltip: "Change Basemap",
        });

        // Add widgets to the view
        mapView.ui.add(homeBtn, "top-left");
        mapView.ui.add(searchWidget, "top-right");
        mapView.ui.add(customLegendDiv, "bottom-left");
        mapView.ui.add(scaleBar, "bottom-right");
        mapView.ui.add(bgExpand, "top-right");
      })
      .catch((err) => {
        console.error("Error loading ArcGIS modules:", err);
        setLoading(false);
      });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [currentBasemap, complaintsData]);

  // Handle closing the custom popup
  const handleClosePopup = () => {
    setSelectedBeat(null);
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }} className="map-container">
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.7)",
            zIndex: 999,
          }}
        >
          <div
            style={{
              padding: "20px",
              background: "white",
              borderRadius: "5px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            <p>Loading Police Beats Map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Render custom popup when a beat is selected */}
      {selectedBeat && <CustomBeatPopup beat={selectedBeat} position={popupPosition} onClose={handleClosePopup} />}
    </div>
  );
};

export default PoliceBeatsMap;
