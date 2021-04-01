import python_jwt as jwt, jwcrypto.jwk as jwk, datetime

key = jwk.JWK.generate(kty='RSA', size=2048)
pub_pem = key.export_to_pem()
#print(pub_pem)
fh_public_pem=open('public_pem', 'wb')
fh_public_pem.write(pub_pem)
fh_public_pem.close()

#print(key.export_private())
print(key.export_public())

public_key=key.export_public()
fh_public=open('public', 'w')
fh_public.write(public_key)
fh_public.close()

fh=open('priv_pem', 'w')
priv_pem = key.export_to_pem(private_key=True, password=None)
fh.write(priv_pem.decode('utf-8'))
fh.close()
