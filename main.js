class Particle {
    constructor(bounds, options) {
        this.bounds = bounds;
        this.options = options;
        this.active = true;

        this.position = this.getRandomPosition();
        this.velocity = this.getRandomVelocity();
        this.lifetime =
            options.minDuration +
            Math.random() * (options.maxDuration - options.minDuration);

        this.element = document.createElement("div");
        this.element.className = "particle";
        this.updatePosition();
    }

    getRandomPosition() {
        return {
            x: Math.random() * this.bounds.width,
            y: Math.random() * this.bounds.height,
        };
    }

    getRandomVelocity() {
        return {
            x: (Math.random() - 0.5) * this.options.maxDistance,
            y: (Math.random() - 0.5) * this.options.maxDistance,
        };
    }

    updatePosition() {
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
    }

    animate() {
        if (!this.active) return;

        const animation = this.element.animate(
            [
                { transform: "translate(0, 0)", opacity: 0 },
                {
                    transform: `translate(${this.velocity.x}px, ${this.velocity.y}px)`,
                    opacity: 0.5,
                    offset: 0.5,
                },
                {
                    transform: `translate(${this.velocity.x * 2}px, ${this.velocity.y * 2}px)`,
                    opacity: 0,
                },
            ],
            {
                duration: this.lifetime,
                iterations: Infinity,
                easing: "ease-in-out",
            }
        );

        return animation;
    }

    deactivate() {
        this.active = false;
        this.element.remove();
    }
}

class ParticleSystem {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.warn(`Invalid container "${containerSelector}"!`);
        } 

        this.options = {
            count: options.count || 50,
            minDuration: options.minDuration || 3000,
            maxDuration: options.maxDuration || 8000,
            maxDistance: options.maxDistance || 200,
        };

        this.particles = new Set();
        this.resizeObserver = null;
        this.bounds = null;
        this.isDestroyed = false;
    }

    init() {
        this.updateBounds();
        this.setupResizeObserver();
        this.createParticles();
    }

    updateBounds() {
        this.bounds = this.container.getBoundingClientRect();
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(
            this.debounce(() => {
                this.updateBounds();
                this.repositionParticles();
            }, 250)
        );
        this.resizeObserver.observe(this.container);
    }

    createParticles() {
        const fragment = document.createDocumentFragment();
        const batchSize = 10;
        let created = 0;

        const createBatch = () => {
            if (this.isDestroyed) return;

            const batchCount = Math.min(
                batchSize,
                this.options.count - created
            );
            for (let i = 0; i < batchCount; i++) {
                const particle = new Particle(this.bounds, this.options);
                fragment.appendChild(particle.element);
                particle.animate();
                this.particles.add(particle);
                created++;
            }

            this.container.appendChild(fragment);

            if (created < this.options.count) {
                requestAnimationFrame(createBatch);
            }
        };

        createBatch();
    }

    repositionParticles() {
        this.particles.forEach((particle) => {
            particle.position = particle.getRandomPosition();
            particle.updatePosition();
        });
    }

    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    destroy() {
        this.isDestroyed = true;
        this.resizeObserver?.disconnect();
        this.particles.forEach((particle) => {
            particle.deactivate();
        });
        this.particles.clear();
    }
}

const particleSystem = new ParticleSystem(".particles", {
    count: 50,
    minDuration: 3000,
    maxDuration: 8000,
    maxDistance: 200,
});

particleSystem.init();
