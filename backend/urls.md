| Tag | Request | After | Before | Views |
|-----|-----|-----|-------|-------|
| Administration |GET  |/levels | /levels/|v1_users.views.view|
| Administration |GET  |/administration/**:id** | /administration/**:pk**/|v1_users.views.view|
| Auth |GET  |/profile | /get/profile/|v1_users.views.view|
| Auth |POST |/login | /login/|v1_users.views.view|
| User |GET  |/user | /list/users/|v1_users.views.view|
| User |POST |/user | /add/user/|v1_users.views.view|
| User |PUT  |/user/**:id** | /edit/user/**:pk**/|v1_users.views.view|
| User |PUT  |/user/**:id** | /set/user/password/|v1_users.views.view|
| User |GET  |/user/roles  | /user/roles/|v1_users.views.view|
| User |GET  |/invitation/**:invitation-id** | /verify/invite/|v1_users.views.view|
| Form |GET  |/form | /forms/|v1_forms.views.view|
| Form |GET  |/form/**:id** | /form/**:pk**/|v1_forms.views.view|
| Form |GET  |/web-form/**:form-id** | /web/form/**:pk**/|v1_forms.views.view|
| Form |PUT  |/form/approval/**:form-id** | /edit/form/approval/|v1_forms.views.view|
| Form |GET  |/form/approver | /form/approver/|v1_forms.views.view|
| Form |POST |/form/approver/**:form-id** | /approval/form/**:pk**/|v1_forms.views.view|
| Form |GET  |/form/approval-level/**:form-id** | /admin/form/approval-level/**:pk**/|v1_forms.views.view|
| Form |POST |/form/approval-level | /form/approval-level/|v1_forms.views.view|
| Form |POST |/form/type | /edit/forms/|v1_forms.views.view|
| Data |GET  |/data | /list/form-data/**:pk**/|v1_data.views.view|
| Data |GET  |/data/**:id** | /data/**:pk**/|v1_data.views.view|
| Data |POST |/data/**:form-id** | /form-data/**:pk**/|v1_data.views.view|
| Pending Data |GET  |/pending-data | /list/pending/form-data/**:pk**/|v1_data.views.view|
| Pending Data |GET  |/pending-data/**:id** | /list/pending/answers/**:pk**/|v1_data.views.view|
| Pending Data |POST |/pending-data/approve | /approve/pending/data/|v1_data.views.view|
| Visualisation |GET  |/maps/**:form-id** | /maps/**:pk**/|v1_data.views.view|
| Visualisation |GET  |/chart/**:form-id** | /chart/data/**:pk**/|v1_data.views.view|
| Dev |GET  |/health/check | /health/check/|v1_users.views.view|
| Dev |GET  |/config.js | /config.js|v1_users.views.view|
