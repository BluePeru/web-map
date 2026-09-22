.PHONY: help build test clean run save sync

help:
	@echo "Project Blue - Android Build Shortcuts"
	@echo "  make build  - Compila el proyecto (assembleDebug)"
	@echo "  make test   - Ejecuta las pruebas unitarias (testDebugUnitTest)"
	@echo "  make clean  - Limpia la cache de build (clean)"
	@echo "  make bundle - Genera el AAB de producción (bundleRelease)"

build:
	./gradlew assembleDebug

test:
	./gradlew testDebugUnitTest

clean:
	./gradlew clean

bundle:
	./gradlew bundleRelease

# --- GIT AUTOMATION (Versión Windows CMD) ---
save:
	@if "$(m)"=="" ( \
		echo ❌ Error: Debes poner un mensaje. Uso: gs "mensaje" & \
		exit 1 \
	)
	@echo 📦 Empaquetando cambios en la rama: $(BRANCH)...
	git add .
	git commit -m "$(m)"
	git push origin $(BRANCH)
	@echo ✅ Listo. Codigo subido a $(BRANCH).

# Sincroniza tu rama actual con los últimos cambios de main para evitar conflictos
sync:
	@echo "🔄 Sincronizando $(BRANCH) con main..."
	git fetch origin main
	git merge origin/main
	@echo "✅ Tu rama está al día con main."
