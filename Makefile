DEV_API = http://localhost:3002/api/v1

.PHONY: dev-up dev-users dev-build-android

dev-up:
	docker compose -f docker-compose.dev.yml up --build -d

dev-build-android:
	cd packages/app && eas build --profile development --platform android --local --non-interactive --output ../../dev-build.apk

dev-users:
	@echo "Creating dev user..."
	@curl -sf -X POST $(DEV_API)/auth/register \
		-H "Content-Type: application/json" \
		-d '{"email":"dev@bzfit.local","password":"bzfit123","name":"Dev User"}' \
		| jq '{email: .user.email, name: .user.name}' \
		&& echo "Done." || echo "User may already exist."
