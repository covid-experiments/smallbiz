import 'firebase/firestore';

import * as firebase from 'firebase/app';
import geohash from 'ngeohash';

// Interfaces to the API for reading/writing.
export interface Business {
  bizName: string;
  bizUrl: string;
  geoLocation: {latitude: number, longitude: number};
}

export interface Post {
  body: string;
  imageUrl: string;
  url: string;
}

// The interface that the database sees.
interface DatabaseBusinessPosts {
  bizName: string;
  bizUrl: string;
  geohash: string;
  latLong: firebase.firestore.GeoPoint;
  posts: DatabasePost[];
}

interface DatabasePost {
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

export async function addPost(business: Business, post: Post) {
  const db = firebase.firestore();

  const {dbBusinessPosts, dbPost} = transformForDatabase(business, post);

  const result = await db.collection('smallbiz-posts').add(dbBusinessPosts);
  console.log(dbPost);

  console.log('Document successfully written!', result);
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
    geohash: geohash.encode(
        business.geoLocation.latitude, business.geoLocation.longitude),
    latLong: new firebase.firestore.GeoPoint(
        business.geoLocation.latitude, business.geoLocation.longitude),
    posts: [dbPost]
  };

  return {dbBusinessPosts, dbPost};
}
