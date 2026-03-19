import locationHumanMarker from "../assets/icons/locationHumanMarker.png";
import locationTargetMarker from "../assets/icons/locationTargetMarker.png";
import L from "leaflet";

export const icons = {
    locationHumanMarker: new L.Icon({
        iconUrl: locationHumanMarker,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    }),

    locationTargetMarker: new L.Icon({
        iconUrl: locationTargetMarker,
        iconSize: [40, 40],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    }),
};
