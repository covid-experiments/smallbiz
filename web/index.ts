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
