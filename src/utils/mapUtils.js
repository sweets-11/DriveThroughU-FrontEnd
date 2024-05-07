import axios from 'axios';
import {GOOGLE_MAPS_KEY} from '@env';
import {getToken} from './storage';
import {AUTH_TOKEN} from './otpFunctions';
import {AWS_BASE_URL} from '@env';
export const RADIUS = 5;
export const radiusToDelta = (lat, radius = RADIUS) => {
  const oneDegreeOfLatitudeInMeters = 111.32 * 1000;
  const delta =
    (radius * 1609.34) /
    (oneDegreeOfLatitudeInMeters * Math.cos(lat * (Math.PI / 180)));

  return {
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
};

export function getRegionForCoordinates(points = []) {
  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      ...radiusToDelta(points[0].latitude),
    };
  }
  let minX, maxX, minY, maxY;

  (point => {
    minX = point.latitude;
    maxX = point.latitude;
    minY = point.longitude;
    maxY = point.longitude;
  })(points[0]);

  points = points.filter(point => point?.latitude && point?.longitude);

  points.map(point => {
    minX = Math.min(minX, point.latitude);
    maxX = Math.max(maxX, point.latitude);
    minY = Math.min(minY, point.longitude);
    maxY = Math.max(maxY, point.longitude);
  });

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const deltaX = maxX - minX;
  const deltaY = maxY - minY;

  return {
    latitude: midX,
    longitude: midY,
    latitudeDelta: deltaX * 1.4,
    longitudeDelta: deltaY * 1.4,
  };
}

export const isValidLocation = location => {
  if (!location) return false;
  if (!location.latitude || !location.longitude) {
    return false;
  }
  return true;
};

export const getAddressByCoordinates = location => {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_KEY}&location_type=ROOFTOP`,
      )
      .then(response => {
        if (response.data) {
          console.log(
            'Response: ',
            response.data.results[0]?.formatted_address,
          );
          resolve(response.data.results[0].formatted_address);
        } else {
          reject('Google API error');
        }
      })
      .catch(error => reject(error));
  });
};

export const calculateHeading = (cord1, cord2) => {
  if (cord2) {
    const {latitude: lat1, longitude: lng1} = cord1;
    const {latitude: lat2, longitude: lng2} = cord2;
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    const θ = Math.atan2(y, x);
    const brng = ((θ * 180) / Math.PI + 360) % 360;
    return brng;
  }
  return 0;
};

export const getDirections = ({
  origin,
  destination,
  setPolyline = () => {},
  setData = () => {},
}) => {
  getToken(AUTH_TOKEN).then(token => {
    axios
      .post(
        `${AWS_BASE_URL}/directions`,
        {
          origin,
          destination,
        },
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        setData(response.data);
        const polyline = response.data.polyline || [];
        setPolyline(
          polyline.filter(
            (ele, ind) =>
              ind ===
              polyline.findIndex(
                elem =>
                  elem.latitude === ele.latitude &&
                  elem.longitude === ele.longitude,
              ),
          ) || null,
        );
      })
      .catch(error => {
        console.log('Error in fetching directions: ', error);
        setPolyline(null);
      });
  });
};

export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};

export const deg2rad = deg => {
  return deg * (Math.PI / 180);
};
function quadraticBezierCurve(p1, p2, controlPoint, numPoints) {
  const points = [];
  const step = 1 / (numPoints - 1);

  for (let t = 0; t <= 1; t += step) {
    const x =
      (1 - t) ** 2 * p1[0] + 2 * (1 - t) * t * controlPoint[0] + t ** 2 * p2[0];
    const y =
      (1 - t) ** 2 * p1[1] + 2 * (1 - t) * t * controlPoint[1] + t ** 2 * p2[1];
    const coord = {latitude: x, longitude: y};
    points.push(coord);
  }

  return points;
}

const calculateControlPoint = (p1, p2) => {
  const d = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
  const h = d * 2;
  const w = d / 2;
  const x_m = (p1[0] + p2[0]) / 2;
  const y_m = (p1[1] + p2[1]) / 2;
  const x_c =
    x_m +
    ((h * (p2[1] - p1[1])) /
      (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
      (w / d);
  const y_c =
    y_m -
    ((h * (p2[0] - p1[0])) /
      (2 * Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2))) *
      (w / d);
  const controlPoint = [x_c, y_c];
  return controlPoint;
};

export const getCurvedPolylinePoints = places => {
  const p1 = [places[0].latitude, places[0].longitude];
  const p2 = [places[1].latitude, places[1].longitude];
  const controlPoint = calculateControlPoint(p1, p2);

  return quadraticBezierCurve(p1, p2, controlPoint, 100);
};
