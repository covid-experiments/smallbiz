import {addPost, getNearbyPosts} from './db';

let place: google.maps.places.PlaceResult = null;

const bodyElement = document.getElementById('body') as HTMLTextAreaElement;
const urlElement = document.getElementById('url') as HTMLInputElement;
const consoleElement = document.getElementById('console');
const postsElement = document.getElementById('posts');

async function main() {
  const businessPosts =
      await getNearbyPosts({latitude: 42.3676446, longitude: -71.1143957});

  businessPosts.forEach(business => {
    const businessElement = document.createElement('div');
    businessElement.innerHTML = `
      <img src='${business.bizImageUrl}'><div>${business.bizName}</div>
    `;
    business.posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.innerHTML = `
        <div>${post.body}</div>
        <a href="${post.url}" target=_blank>link</a>
      `;
      businessElement.appendChild(postElement);
    });

    postsElement.appendChild(businessElement);
  });
}
main();

document.getElementById('add').addEventListener('click', async () => {
  if (place == null) {
    alert('place is required');
    return;
  }
  const body = bodyElement.value;
  if (body.trim() === '') {
    alert('body is required');
    return;
  }
  const url = urlElement.value;
  if (url.trim() === '') {
    alert('url is required');
    return;
  }

  await addPost(
      {
        bizName: place.name,
        // TODO: figure out if we need this.
        bizUrl: 'https://google.com/',
        bizImageUrl: place.icon,
        geoLocation: {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }
      },
      {body, imageUrl: 'https://google.com/fakeimage', url});
  consoleElement.innerText = 'done, refresh';
});

// tslint:disable-next-line:no-any
(window as any).initMap = () => {
  const input = document.getElementById('pac-input') as HTMLInputElement;
  const autocomplete = new google.maps.places.Autocomplete(input);
  // Set the data fields to return when the user selects a place.
  autocomplete.setFields(['address_components', 'geometry', 'icon', 'name']);
  // Search only businesses/establishments.
  autocomplete.setTypes(['establishment']);

  autocomplete.addListener('place_changed', () => {
    place = autocomplete.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert('Please select from the dropdown.');
      return;
    }
    console.log(place);
    console.log(place.address_components);
    console.log(
        'lat/lng', place.geometry.location.lat(),
        place.geometry.location.lng());
  });
};
