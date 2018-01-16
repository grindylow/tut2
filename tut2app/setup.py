# created according to instructions given at
# http://flask.pocoo.org/docs/0.12/patterns/packages/

from setuptools import setup

setup(
    name='tut2app',
    packages=['tut2app'],
    include_package_data=True,
    install_requires=[
        'flask',
    ],
)
