


CREATE DATABASE plocal:C:\Users\Trancho\Documents\GitHub\cashless\data\cless


CREATE CLASS Customer
CREATE PROPERTY Customer.code String
CREATE PROPERTY Customer.name String
CREATE PROPERTY Customer.issueDate Date
CREATE PROPERTY Customer.discount Double

ALTER PROPERTY Customer.issueDate default sysdate()
ALTER PROPERTY Customer.discount DEFAULT 0



CREATE CLASS Charge
CREATE PROPERTY Charge.issueDate Date
CREATE PROPERTY Charge.issuedFrom Integer 
CREATE PROPERTY Charge.amount Double
CREATE PROPERTY Charge.customerId Integer

ALTER PROPERTY Charge.issueDate default sysdate()
ALTER PROPERTY Charge.issuedFrom DEFAULT 0
ALTER PROPERTY Charge.amount DEFAULT 0


CREATE LINK charges FROM Charge.customerId TO Customer.id INVERSE



CREATE LINK Customer.charges TYPE LINKSET FROM Charge.customerId TO Customer.id INVERSE