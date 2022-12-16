from flask.cli import FlaskGroup
from project.server import create_app
from flask_cors import CORS, cross_origin


app = create_app()
CORS(app)

cli = FlaskGroup(create_app=create_app)

if __name__ == "__main__":
    cli()