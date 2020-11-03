# created according to instructions given at
# https://flask.palletsprojects.com/en/1.1.x/tutorial/install/

from setuptools import find_packages, setup

setup(
    name='tut2app',
    version='0.7.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask',
        'flask-login',
        'pymongo',
    ],
)
