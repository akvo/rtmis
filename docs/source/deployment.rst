Deployment
----------

.. code:: bash

   export CI_COMMIT='local'
   ./ci/build.sh

Above command will generate two docker images with prefix
``eu.gcr.io/akvo-lumen/rtmis`` for backend and frontend

.. code:: bash

   docker-compose -f docker-compose.yml -f docker-compose.ci.yml up -d

Network config:
`nginx <https://github.com/akvo/rtmis/blob/main/frontend/nginx/conf.d/default.conf>`__
