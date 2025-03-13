import React, { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import HeatmapRenderer from "@arcgis/core/renderers/HeatmapRenderer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import PopupTemplate from "@arcgis/core/PopupTemplate";

// Hardcoded data for Chandler beats
const heatMapData = [
  { beat: "beat 1", name: "Downtown Chandler Central", lat: 33.3018, lon: -111.8413, openCases: 25, id: "sasas" },
  { beat: 2, name: "North Downtown", lat: 33.306, lon: -111.84, openCases: 18 },
  { beat: 3, name: "South Downtown", lat: 33.297, lon: -111.842, openCases: 22 },
  { beat: 4, name: "East Downtown", lat: 33.302, lon: -111.835, openCases: 15 },
  { beat: 5, name: "West Downtown", lat: 33.302, lon: -111.847, openCases: 12 },
  { beat: 6, name: "North Chandler - Arizona Ave", lat: 33.3351, lon: -111.8415, openCases: 10 },
  { beat: 7, name: "North Chandler - Alma School", lat: 33.34, lon: -111.83, openCases: 8 },
  { beat: 8, name: "North Chandler - Dobson", lat: 33.34, lon: -111.85, openCases: 6 },
  { beat: 9, name: "South Chandler - Fashion Center", lat: 33.2765, lon: -111.841, openCases: 20 },
  { beat: 10, name: "South Chandler - Ocotillo", lat: 33.27, lon: -111.84, openCases: 18 },
  { beat: 11, name: "East Chandler - Gilbert Rd", lat: 33.3018, lon: -111.8, openCases: 5 },
  { beat: 12, name: "East Chandler - McQueen", lat: 33.305, lon: -111.81, openCases: 7 },
  { beat: 13, name: "West Chandler - I-10", lat: 33.3018, lon: -111.88, openCases: 12 },
  { beat: 14, name: "West Chandler - Kyrene", lat: 33.3, lon: -111.87, openCases: 9 },
  { beat: 15, name: "Northeast - Loop 202", lat: 33.335, lon: -111.82, openCases: 8 },
  { beat: 16, name: "Northeast - Ocotillo Golf", lat: 33.33, lon: -111.815, openCases: 4 },
  { beat: 17, name: "Southeast - Arizona Ave South", lat: 33.276, lon: -111.82, openCases: 23 },
  { beat: 18, name: "Southeast - Warner Rd", lat: 33.28, lon: -111.825, openCases: 19 },
  { beat: 19, name: "Southwest - Kyrene Rd", lat: 33.276, lon: -111.86, openCases: 15 },
  { beat: 20, name: "Southwest - Chandler Blvd", lat: 33.28, lon: -111.865, openCases: 13 },
  { beat: 21, name: "Northwest - Dobson Rd", lat: 33.335, lon: -111.86, openCases: 3 },
  { beat: 22, name: "Northwest - Ray Rd", lat: 33.33, lon: -111.855, openCases: 5 },
  { beat: 23, name: "Central-East - Cooper Rd", lat: 33.3018, lon: -111.82, openCases: 19 },
  { beat: 24, name: "Central-East - Alma School", lat: 33.305, lon: -111.825, openCases: 16 },
  { beat: 25, name: "Central-West - Price Rd", lat: 33.3, lon: -111.845, openCases: 14 },
  { beat: 26, name: "North - Pecos Rd", lat: 33.345, lon: -111.835, openCases: 7 },
  { beat: 27, name: "South - Queen Creek Rd", lat: 33.265, lon: -111.845, openCases: 21 },
  { beat: 28, name: "East - Lindsay Rd", lat: 33.3, lon: -111.79, openCases: 6 },
  { beat: 29, name: "West - 48th St", lat: 33.305, lon: -111.89, openCases: 11 },
  { beat: 30, name: "Northeast - Germann Rd", lat: 33.34, lon: -111.81, openCases: 9 },
  { beat: 31, name: "Southeast - Alma School South", lat: 33.27, lon: -111.83, openCases: 17 },
  { beat: 32, name: "Southwest - Dobson South", lat: 33.275, lon: -111.855, openCases: 10 },
  { beat: 33, name: "Northwest - McClintock", lat: 33.34, lon: -111.865, openCases: 4 },
  { beat: 34, name: "Central - Boston St", lat: 33.3, lon: -111.838, openCases: 20 },
  { beat: 35, name: "East - Chandler Heights", lat: 33.295, lon: -111.805, openCases: 8 },
  { beat: 36, name: "West - Sun Lakes", lat: 33.29, lon: -111.875, openCases: 13 },
  { beat: 37, name: "North - Warner Rd East", lat: 33.345, lon: -111.825, openCases: 6 },
  { beat: 38, name: "South - Pecos Rd", lat: 33.265, lon: -111.835, openCases: 16 },
  { beat: 39, name: "East - Riggs Rd", lat: 33.285, lon: -111.8, openCases: 7 },
  { beat: 40, name: "West - Price Corridor", lat: 33.305, lon: -111.885, openCases: 14 },
  { beat: 41, name: "Northeast - McQueen North", lat: 33.35, lon: -111.82, openCases: 5 },
  { beat: 42, name: "Southeast - Dobson South", lat: 33.27, lon: -111.85, openCases: 22 },
  { beat: 43, name: "Southwest - Alma School", lat: 33.275, lon: -111.83, openCases: 11 },
  { beat: 44, name: "Northwest - Loop 101", lat: 33.34, lon: -111.875, openCases: 3 },
  { beat: 45, name: "Central-East - Ray Rd", lat: 33.3, lon: -111.815, openCases: 18 },
  { beat: 46, name: "Central-West - Germann Rd", lat: 33.305, lon: -111.85, openCases: 15 },
  { beat: 47, name: "North - Chandler Blvd", lat: 33.35, lon: -111.84, openCases: 9 },
  { beat: 48, name: "South - Gilbert Rd", lat: 33.265, lon: -111.82, openCases: 24 },
  { beat: 49, name: "East - Warner Rd East", lat: 33.28, lon: -111.805, openCases: 10 },
  { beat: 50, name: "West - Ocotillo Rd", lat: 33.29, lon: -111.87, openCases: 17 },
];

const HeatMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Initialize the map
    const map = new Map({
      basemap: "streets-vector",
    });

    // Create a map view centered on Chandler, AZ
    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: [-111.8413, 33.3018], // Center of Chandler
      zoom: 12,
    });

    // Create graphics for the heatmap layer
    const heatMapGraphics = heatMapData.map((data) => {
      return new Graphic({
        geometry: new Point({
          longitude: data.lon,
          latitude: data.lat,
        }),
        attributes: {
          openCases: data.openCases,
          beat: data.beat,
          name: data.name,
        },
      });
    });

    // Heatmap Feature Layer
    const heatMapLayer = new FeatureLayer({
      source: heatMapGraphics,
      objectIdField: "beat",
      fields: [
        { name: "beat", type: "integer" },
        { name: "name", type: "string" },
        { name: "openCases", type: "integer" },
      ],
      renderer: new HeatmapRenderer({
        field: "openCases",
        colorStops: [
          { ratio: 0, color: "rgba(0, 255, 0, 0)" }, // Green for low values
          { ratio: 0.5, color: "rgba(255, 255, 0, 0.8)" }, // Yellow for medium
          { ratio: 1, color: "rgba(255, 0, 0, 1)" }, // Red for high values
        ],
        blurRadius: 10,
        maxPixelIntensity: 30, // Adjusted to match the highest openCases value
        minPixelIntensity: 0,
      }),
    });

    // Create graphics for the point layer (for popups and clicks)
    const pointGraphics = heatMapData.map((data) => {
      return new Graphic({
        geometry: new Point({
          longitude: data.lon,
          latitude: data.lat,
        }),
        attributes: {
          openCases: data.openCases,
          beat: data.beat,
          name: data.name,
        },
        symbol: {
          type: "simple-marker", // Invisible marker for interaction
          color: [0, 0, 0, 0], // Fully transparent
          size: 1, // Small size to avoid visual clutter
        },
      });
    });

    // Point Feature Layer with Popup and Click handlers
    const pointLayer = new FeatureLayer({
      source: pointGraphics,
      objectIdField: "beat",
      fields: [
        { name: "beat", type: "integer" },
        { name: "name", type: "string" },
        { name: "openCases", type: "integer" },
      ],
      popupTemplate: new PopupTemplate({
        title: "{beat}",
        content: "Open Complaints: {openCases}",
      }),
    });

    // Add layers to the map
    map.addMany([heatMapLayer, pointLayer]);

    // Handle click event
    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const graphic = response.results.find((result) => result.graphic.layer === pointLayer);
        if (graphic) {
          const attributes = graphic.attributes;
          console.log("Clicked Data:", attributes);
        }
      });
    });

    // Cleanup on unmount
    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  return <div style={{ height: "100vh", width: "100%" }} ref={mapRef}></div>;
};

export default HeatMap;
