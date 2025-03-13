import React, { useEffect, useRef } from "react";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Legend from "@arcgis/core/widgets/Legend";
import Expand from "@arcgis/core/widgets/Expand";

import "@arcgis/core/assets/esri/themes/dark/main.css";

const ArcGISMap = () => {
  const mapRef = useRef(null); // Reference to div for the map

  const fetchData = async () => {
    const url = "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/homicide_wp_time/FeatureServer/";

    const params = new URLSearchParams({
      where: "1=1", // This will fetch all records
      outFields: "*", // Get all the fields (you can specify particular fields if needed)
      f: "json", // Request the response in JSON format
      returnGeometry: "true", // Return the geometry (geospatial data)
      orderByFields: "victim_age_years", // Optional: order by a specific field like victim_age_years
    });

    try {
      const response = await fetch(`${url}?${params}`);
      const data = await response.json();
      console.log(data); // Print the data to the console (you can process it as needed)
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Call the fetchData function
  fetchData();
  useEffect(() => {
    if (!mapRef.current) return;

    // Feature layer with clustering
    const featureLayer = new FeatureLayer({
      url: "https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/homicide_wp_time/FeatureServer",
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          size: 5,
          color: "#ff4d6a",
          outline: {
            color: "#453437",
            width: "0.5px",
          },
        },
        visualVariables: [
          {
            type: "color",
            field: "victim_age_years",
            stops: [
              { value: 15, color: "#ff4d6a" },
              { value: 30, color: "#ffc800" },
              { value: 45, color: "#66a0ff" },
            ],
          },
        ],
      },
      featureReduction: {
        type: "cluster",
        clusterMinSize: "16px",
        clusterMaxSize: "60px",
        labelingInfo: [
          {
            deconflictionStrategy: "none",
            labelExpressionInfo: {
              expression: "Text($feature.cluster_count, '#,###')",
            },
            symbol: {
              type: "text",
              color: "#453437",
              font: {
                weight: "bold",
                family: "Noto Sans",
                size: "12px",
              },
            },
            labelPlacement: "center-center",
          },
        ],
        popupTemplate: {
          content: [
            {
              type: "text",
              text: "This cluster represents <b>{cluster_count}</b> homicides.",
            },
            {
              type: "text",
              text: "Average victim age: <b>{cluster_avg_victim_age_years}</b>",
            },
          ],
        },
      },
    });

    // Create map and view
    const map = new WebMap({
      basemap: "dark-gray-vector",
      layers: [featureLayer],
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: [-75.1652, 39.9526], // Philadelphia
      zoom: 11,
    });

    // Add legend widget
    const legendExpand = new Expand({
      view: view,
      content: new Legend({ view: view }),
      expanded: view.widthBreakpoint !== "xsmall",
    });

    view.ui.add(legendExpand, "bottom-left");

    return () => {
      view.destroy(); // Cleanup on unmount
    };
  }, []);

  return <div ref={mapRef} style={{ height: "100vh", width: "100vw", overflow: "hidden" }} />;
};

export default ArcGISMap;
