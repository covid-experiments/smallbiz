# COVID-19 updates from businesses around you

## Development

First time setup:
```sh
python3 -m venv ~/smallbiz-venv
source ~/smallbiz-venv/bin/activate
pip install -r requirements.txt
```

Dev setup:

```sh
source ~/smallbiz-venv/bin/activate
python main.py
```

To deploy:
```sh
gcloud app deploy app.yaml --project covid-experiments
```


