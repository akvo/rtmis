.. raw:: html

    <style>
      .heading {font-size: 34px; font-weight: 700;}
    </style>

.. role:: heading

:heading:`Getting Started`

Real Time Monitoring Information Systems


Prerequisite
------------

-  Docker > v19
-  Docker Compose > v2.1
-  Docker Sync 0.7.1


Environment Setup
-----------------

Expected that PORT 5432 and 3000 are not being used by other services.

Start
^^^^^

For initial run, you need to create a new docker volume.

.. code:: bash

   ./dc.sh up -d

.. code:: bash

   docker volume create rtmis-docker-sync

The app should be running at:
`localhost:3000 <http://localhost:3000>`__. Any endpoints with prefix -
``^/api/*`` is redirected to
`localhost:8000/api <http://localhost:8000/api>`__ -
``^/static-files/*`` is for worker service in
`localhost:8000 <http://localhost:8000/static-files>`__

Network Config: -
`setupProxy.js <https://github.com/akvo/rtmis/blob/main/frontend/src/setupProxy.js>`__
-
`mainnetwork <https://github.com/akvo/rtmis/blob/docker-compose.override.yml#L4-L8>`__
container setup

Log
^^^

.. code:: bash

   ./dc.sh log --follow <container_name>

Available containers: - backend - frontend - mainnetwork - db - pgadmin

Stop
^^^^

.. code:: bash

   ./dc.sh stop

Teardown
^^^^^^^^

.. code:: bash

   docker-compose down -v
   docker volume rm rtmis-docker-sync
