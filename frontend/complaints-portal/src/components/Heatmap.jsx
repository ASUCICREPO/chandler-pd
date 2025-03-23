import React, { useEffect, useRef } from "react";
import { loadModules } from "esri-loader";
import { beatsData } from "../beatsData/beats";

// Complaints data
const complaintsPerBeat = {
  1: 10,
  2: 66,
  3: 88,
  4: 89,
  5: 19,
  7: 19,
};

const PoliceBeatsMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!beatsData.features) return; // Wait until data is loaded

    // Load ArcGIS modules
    loadModules(["esri/Map", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/geometry/SpatialReference", "esri/renderers/SimpleRenderer", "esri/symbols/SimpleFillSymbol"], { css: true })
      .then(([Map, MapView, FeatureLayer, SpatialReference, SimpleRenderer, SimpleFillSymbol]) => {
        // Create map
        const map = new Map({
          basemap: "streets",
        });

        // Create map view
        const view = new MapView({
          container: mapRef.current,
          map: map,
          center: [-111.8413, 33.3015], // Approximate center of Chandler, AZ
          zoom: 12,
        });

        // Calculate min and max complaints for color scaling
        const complaintValues = Object.values(complaintsPerBeat);
        const minComplaints = Math.min(...complaintValues);
        const maxComplaints = Math.max(...complaintValues);

        // Transform beats data into features, including complaint counts
        const features = beatsData.features.map((beat) => {
          const beatNumber = beat.attributes.POLICE_BEAT;
          const complaintCount = complaintsPerBeat[beatNumber] || 0;

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
            },
          };
        });

        // Create a renderer with a refined color gradient for a heatmap-like effect
        const renderer = new SimpleRenderer({
          symbol: new SimpleFillSymbol({
            style: "solid",
            outline: {
              color: [0, 0, 0, 0.5],
              width: 0.5,
            },
          }),
          visualVariables: [
            {
              type: "color",
              field: "COMPLAINT_COUNT",
              stops: [
                { value: 0, color: [0, 255, 0, 0] }, // Transparent green for 0 complaints
                { value: minComplaints, color: [0, 255, 0, 0.3] }, // Light green
                { value: minComplaints + (maxComplaints - minComplaints) * 0.25, color: [144, 238, 144, 0.5] }, // Lighter green
                { value: (minComplaints + maxComplaints) / 2, color: [255, 165, 0, 0.7] }, // Orange
                { value: maxComplaints - (maxComplaints - minComplaints) * 0.25, color: [255, 69, 0, 0.8] }, // Red-orange
                { value: maxComplaints, color: [255, 0, 0, 0.9] }, // Red
              ],
            },
          ],
        });

        // Create police beats layer
        const beatsLayer = new FeatureLayer({
          source: features,
          objectIdField: "OBJECTID",
          geometryType: "polygon",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "POLICE_BEAT", type: "string" },
            { name: "DISTRICT", type: "integer" },
            { name: "COMPLAINT_COUNT", type: "integer" },
          ],
          renderer: renderer,
          popupTemplate: {
            title: "Police Beat {POLICE_BEAT}",
            content: "District: {DISTRICT}<br/>Open Complaints: {COMPLAINT_COUNT}",
          },
          labelingInfo: [
            {
              labelExpressionInfo: { expression: "$feature.POLICE_BEAT" },
              symbol: {
                type: "text",
                color: "black",
                font: {
                  size: 10,
                  weight: "bold",
                },
              },
            },
          ],
        });

        // Add layer to map
        map.add(beatsLayer);

        // Cleanup
        return () => {
          if (view) {
            view.destroy();
          }
        };
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

export default PoliceBeatsMap;
