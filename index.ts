import 'firebase/firestore';
import * as firebase from 'firebase/app';

// Initialize Cloud Firestore through Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyBXWLQIPaqbiW_qgNV_DskWKx39t8dn030',
  authDomain: 'covid-exp.firebaseapp.com',
  projectId: 'covid-exp'
});

const db = firebase.firestore();

async function main() {
  const querySnapshot = await db.collection('smallbiz-posts').get();

  querySnapshot.forEach((doc) => {
    console.log('id', doc.id);
    console.log(doc.data());
  });
}
main();
