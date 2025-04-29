.PHONY run
run:
	npx http-server -p 3000
	npx http-server -S -C ssl/cert.pem -K ssl/key.pem -p 3000
