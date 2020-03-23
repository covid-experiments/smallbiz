import 'firebase/firestore';

import * as firebase from 'firebase/app';
import geohash from 'ngeohash';

const COLLECTION_NAME = 'smallbiz-posts';
const MILES_RANGE = 3;

// Interfaces to the API for reading/writing.
export interface Business {
  bizName: string;
  bizUrl: string;
  bizImageUrl: string;
  geoLocation: {latitude: number, longitude: number};
}

export interface Post {
  body: string;
  imageUrl: string;
  url: string;
}

// The interface that the database sees.
export interface DatabaseBusinessPosts {
  bizName: string;
  bizUrl: string;
  bizImageUrl: string;
  geohash: string;
  latLong: firebase.firestore.GeoPoint;
  posts: DatabasePost[];
}

export interface DatabasePost {
  body: string;
  dateAdded: number;
  imageUrl: string;
  url: string;
}

firebase.initializeApp({
  apiKey: 'AIzaSyBXWLQIPaqbiW_qgNV_DskWKx39t8dn030',
  authDomain: 'covid-exp.firebaseapp.com',
  projectId: 'covid-exp'
});

export async function getNearbyPosts(
    location: {latitude: number, longitude: number}) {
  const db = firebase.firestore();

  const geoHashRange =
      getGeoHashRange(location.latitude, location.longitude, MILES_RANGE);

  return new Promise<DatabaseBusinessPosts[]>((resolve, reject) => {
    db.collection(COLLECTION_NAME)
        .where('geohash', '>=', geoHashRange.lowerGeoHash)
        .where('geohash', '<=', geoHashRange.upperGeoHash)
        .onSnapshot(snapshot => {
          const results: DatabaseBusinessPosts[] = [];
          snapshot.forEach(snap => {
            results.push(snap.data() as DatabaseBusinessPosts);
          });
          resolve(results);
        });
  });
}

function getGeoHashRange(
    latitude: number, longitude: number,
    distanceMiles: number): {lowerGeoHash: string, upperGeoHash: string} {
  const latitudeMiles = 0.0144927536231884;
  const longitudeMiles = 0.0181818181818182;

  const lowerLat = latitude - latitudeMiles * distanceMiles;
  const lowerLon = longitude - longitudeMiles * distanceMiles;

  const upperLat = latitude + latitudeMiles * distanceMiles;
  const upperLon = longitude + longitudeMiles * distanceMiles;

  const lowerGeoHash = geohash.encode(lowerLat, lowerLon);
  const upperGeoHash = geohash.encode(upperLat, upperLon);

  return {lowerGeoHash, upperGeoHash};
}

export async function addPost(business: Business, post: Post) {
  const db = firebase.firestore();

  const {dbBusinessPosts, dbPost} = transformForDatabase(business, post);
  // Dont do anything with this yet, it's embedded in the business post. In the
  // future we can use this for an update.
  // tslint:disable-next-line:no-unused-expression
  [dbPost];

  await db.collection(COLLECTION_NAME).add(dbBusinessPosts);
}

function transformForDatabase(business: Business, post: Post):
    {dbBusinessPosts: DatabaseBusinessPosts, dbPost: DatabasePost} {
  const dbPost: DatabasePost = {
    body: post.body,
    // Firebase doesn't support datetimes in repeated fields.
    dateAdded: Date.now(),
    imageUrl: post.imageUrl,
    url: post.url
  };
  const dbBusinessPosts: DatabaseBusinessPosts = {
    bizName: business.bizName,
    bizUrl: business.bizUrl,
    bizImageUrl: business.bizImageUrl,
    geohash: geohash.encode(
        business.geoLocation.latitude, business.geoLocation.longitude),
    latLong: new firebase.firestore.GeoPoint(
        business.geoLocation.latitude, business.geoLocation.longitude),
    posts: [dbPost]
  };

  return {dbBusinessPosts, dbPost};
}
