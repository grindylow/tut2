import logging

if __name__ == '__main__':
    logging.basicConfig(level=logging.DEBUG)
    logging.info("Starting...")

    from tut2 import app
    app.run(debug=True,host='0.0.0.0')

