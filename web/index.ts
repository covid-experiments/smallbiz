import {addPost} from './db';

document.getElementById('add').addEventListener('click', async () => {
  await addPost(
      {
        bizName: 'Nikhils Business',
        bizUrl: 'https://google.com/',
        geoLocation: {latitude: 42.3676446, longitude: -71.1143957}
      },
      {
        body: 'Test body',
        imageUrl: 'https://google.com/image',
        url: 'https://google.com/'
      });
  console.log('done');
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
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert('Please select from the dropdown.');
      return;
    }
    console.log(place.address_components);
    console.log(
        'lat/lng', place.geometry.location.lat(),
        place.geometry.location.lng());
  });
};
