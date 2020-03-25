import 'firebase/firestore';
import * as firebase from 'firebase/app';
import * as geolib from 'geolib';
import geohash from 'ngeohash';

const COLLECTION_NAME = 'smallbiz-posts';
const MILES_RANGE = 10;
const RESULT_LIMIT = 100;

const FEET_IN_A_METER = 3.28084;
const FEET_IN_A_MILE = 5280;

// Interfaces to the API for writing.
export interface WriteBusiness {
  bizName: string;
  bizUrl: string;
  bizImageUrl: string;
  geoLocation: {latitude: number, longitude: number};
}
export interface WritePost {
  body: string;
  imageUrl: string;
  url: string;
}

// Interface returned by the API.
export interface ReadBusiness {
  bizName: string;
  bizUrl: string;
  bizImageUrl: string;
  distanceMiles: number;
  // This interface is the same when reading side.
  posts: DatabasePost[];
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
    location: {latitude: number, longitude: number}): Promise<ReadBusiness[]> {
  const db = firebase.firestore();

  const geoHashRange =
      getGeoHashRange(location.latitude, location.longitude, MILES_RANGE);

  return new Promise<ReadBusiness[]>((resolve, reject) => {
    db.collection(COLLECTION_NAME)
        .where('geohash', '>=', geoHashRange.lowerGeoHash)
        .where('geohash', '<=', geoHashRange.upperGeoHash)
        .limit(RESULT_LIMIT)
        .onSnapshot(snapshot => {
          let readBusinesses: ReadBusiness[] = [];
          snapshot.forEach(snap => {
            const dbBusinessPost = snap.data() as DatabaseBusinessPosts;
            const distanceMeters = geolib.getDistance(location, {
              latitude: dbBusinessPost.latLong.latitude,
              longitude: dbBusinessPost.latLong.longitude
            });
            const distanceMiles =
                (distanceMeters * FEET_IN_A_METER) / FEET_IN_A_MILE;
            readBusinesses.push({
              bizName: dbBusinessPost.bizName,
              bizUrl: dbBusinessPost.bizUrl,
              bizImageUrl: dbBusinessPost.bizImageUrl,
              distanceMiles,
              posts: dbBusinessPost.posts
            });
          });
          readBusinesses = readBusinesses.sort(
              (a, b) => (a.distanceMiles > b.distanceMiles ? 1 : -1));
          resolve(readBusinesses);
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

export async function addPost(business: WriteBusiness, post: WritePost) {
  const db = firebase.firestore();

  const {dbBusinessPosts, dbPost} = transformForDatabase(business, post);
  // Dont do anything with this yet, it's embedded in the business post. In
  // the future we can use this for an update.
  // tslint:disable-next-line:no-unused-expression
  [dbPost];

  await db.collection(COLLECTION_NAME).add(dbBusinessPosts);
}

function transformForDatabase(business: WriteBusiness, post: WritePost):
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
