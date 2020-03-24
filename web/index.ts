import {addPost, getNearbyPosts} from './db';

let place: google.maps.places.PlaceResult;
let instagramMetadata: {url: string, imageUrl: string, body: string};

const instagramInputElement =
    document.getElementById('instagram') as HTMLInputElement;
const consoleElement = document.getElementById('console');
const postsElement = document.getElementById('posts');
const latitudeElement = document.getElementById('latitude') as HTMLInputElement;
const longitudeElement =
    document.getElementById('longitude') as HTMLInputElement;

navigator.geolocation.getCurrentPosition(position => {
  const userLocation = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
  latitudeElement.value = userLocation.latitude.toString();
  longitudeElement.value = userLocation.longitude.toString();
  showPosts(userLocation);

  const customLocation = () => {
    showPosts(
        {latitude: +latitudeElement.value, longitude: +longitudeElement.value});
  };
  latitudeElement.addEventListener('change', customLocation);
  longitudeElement.addEventListener('change', customLocation);
});

async function showPosts(userLocation: {latitude: number, longitude: number}) {
  const businessPosts = await getNearbyPosts(userLocation);

  postsElement.innerHTML = '';
  businessPosts.forEach(business => {
    const businessElement = document.createElement('div');
    businessElement.innerHTML = `
      <!--<img src='${business.bizImageUrl}'>-->
      <br>
      <div>${business.bizName}</div>
      <div>${business.distanceMiles.toFixed(2)} miles away</div>
    `;
    business.posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.innerHTML = `
        <a href="${post.url}" target=_blank><img class="instagram" src="${
          post.imageUrl}"></a></img>
        <div class="instagram">${post.body}</div>
      `;
      businessElement.appendChild(postElement);
    });

    postsElement.appendChild(businessElement);
  });
}

instagramInputElement.addEventListener('change', async () => {
  const instagramLink = instagramInputElement.value;

  // tslint:disable-next-line:no-any
  const instagramMetadataResponse: any =
      await (await fetch(`${instagramLink}?__a=1`)).json();
  instagramMetadata = {
    url: instagramLink,
    imageUrl: instagramMetadataResponse.graphql.shortcode_media.display_url,
    body:
        instagramMetadataResponse.graphql.shortcode_media.edge_media_to_caption
            .edges[0]
            .node.text,
  };
  showInstagramMetadata();
});

function showInstagramMetadata() {
  const instagramImg =
      document.getElementById('instagram-img') as HTMLImageElement;
  instagramImg.src = instagramMetadata.imageUrl;
  instagramImg.width = 400;

  const instagramDescription = document.getElementById('instagram-description');
  instagramDescription.innerText = instagramMetadata.body;
}

document.getElementById('add').addEventListener('click', async () => {
  if (place == null) {
    alert('place is required');
    return;
  }

  if (instagramMetadata == null) {
    alert('insta post is required, please wait for request to finish');
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
      {
        body: instagramMetadata.body,
        imageUrl: instagramMetadata.imageUrl,
        url: instagramMetadata.url
      });
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
