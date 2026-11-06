sudo apt install redis-server -y
sudo service redis-server start
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo apt install php-redis -y 

/operations/examinations	Schedule and manage examinations
/operations/examinations/:id	Record examination findings
/operations/examinations/review	Supervisor reviews completed examinations
/operations/examinations/review/:id	View full shipment/container details and approve or refer
/operations/documents	Validate required documents
/operations/finance	Charges and payment reconciliation
/operations/release	Release authorisation
/operations/gate	Final gate-out verification