import sys

import pygame
import random
import os

# Game constants
TILE_SIZE = 24
MAP_LAYOUT = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.#####.##.#####.######",
    "     #.#####.##.#####.#     ",
    "     #.##..........##.#     ",
    "     #.##.###--###.##.#     ",
    "######.##.#      #.##.######",
    "G P   .   #   M  #   .     G",
    "######.##.#      #.##.######",
    "     #.##.########.##.#     ",
    "     #.##..........##.#     ",
    "     #.##.########.##.#     ",
    "######.##.########.##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################",
]

ROWS = len(MAP_LAYOUT)
COLS = len(MAP_LAYOUT[0])

# Width reserved for UI panel on the left
UI_PANEL_WIDTH = 200

# Total window size: UI panel + maze
WIDTH = COLS * TILE_SIZE + UI_PANEL_WIDTH
HEIGHT = ROWS * TILE_SIZE
FPS = 60

pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Minotaur's Labyrinth")
clock = pygame.time.Clock()
font = pygame.font.SysFont(None, 28)

# Colors
BLACK = (60, 35, 15)           # darker shade of orangish-brown (not black)
BLUE = (190, 120, 60)          # lighter orangish-brown walls
YELLOW = (255, 255, 0)
WHITE = (255, 255, 255)
RED = (200, 40, 40)
HUMAN_COLOR = (240, 220, 160)  # not used for drawing anymore
GATE_COLOR_CLOSED = (0, 200, 200)
GATE_COLOR_OPEN = (150, 250, 250)
GREEN = (0, 255, 0)            # bright green pellets

# Sprite sizes
PLAYER_SIZE = TILE_SIZE * 2        # Theseus (player) bigger than one tile
HUMAN_SIZE = TILE_SIZE * 2         # tributes same size as player
MINOTAUR_SIZE = TILE_SIZE * 3      # Minotaur is a big boy

# Wall and gate sprites
wall_image = pygame.image.load(("sprites/wall.png")).convert_alpha()
wall_image = pygame.transform.smoothscale(wall_image, (TILE_SIZE, TILE_SIZE))

gate_locked_image = pygame.image.load(("sprites/gate_locked.png")).convert_alpha()
gate_locked_image = pygame.transform.smoothscale(gate_locked_image, (TILE_SIZE, TILE_SIZE))

gate_open_image = pygame.image.load(("sprites/gate_open.png")).convert_alpha()
gate_open_image = pygame.transform.smoothscale(gate_open_image, (TILE_SIZE, TILE_SIZE))

floor_image = pygame.image.load(("sprites/floor.png")).convert_alpha()
floor_image = pygame.transform.smoothscale(floor_image, (TILE_SIZE, TILE_SIZE))

# Player and human sprites
theseus_image = pygame.image.load(("sprites/theseus.png")).convert_alpha()
theseus_image = pygame.transform.smoothscale(theseus_image, (PLAYER_SIZE, PLAYER_SIZE))

tribute_image = pygame.image.load(("sprites/tribute.png")).convert_alpha()
tribute_image = pygame.transform.smoothscale(tribute_image, (HUMAN_SIZE, HUMAN_SIZE))

# Sound effects
try:
    minotaur_eat_sound = pygame.mixer.Sound(("sounds/game-eat-sound-83240.mp3"))
    minotaur_eat_sound.set_volume(1.0)  # louder
except pygame.error:
    minotaur_eat_sound = None

try:
    minotaur_scream_sound = pygame.mixer.Sound(("sounds/male-death-scream-horror-352706.mp3"))
    minotaur_scream_sound.set_volume(1.0)  # louder
except pygame.error:
    minotaur_scream_sound = None

pellet_sounds = []
pellet_sounds_dir = ("sounds/pellet")
try:
    for name in os.listdir(pellet_sounds_dir):
        if name.lower().endswith((".wav", ".ogg", ".mp3")):
            path = os.path.join(pellet_sounds_dir, name)
            try:
                s = pygame.mixer.Sound(path)
                s.set_volume(0.4)  # quieter pellets
                pellet_sounds.append(s)
            except pygame.error:
                pass
except FileNotFoundError:
    pellet_sounds = []

# Game over and victory sprites
gameover_image = pygame.image.load(("sprites/gameover.png")).convert_alpha()
victory_image = pygame.image.load(("sprites/victory.png")).convert_alpha()

# Scale them to fit within the window while preserving aspect ratio
def scale_to_fit(img, max_w, max_h):
    w, h = img.get_width(), img.get_height()
    scale = min(max_w / w, max_h / h, 1.0)
    return pygame.transform.smoothscale(img, (int(w * scale), int(h * scale)))

gameover_image = scale_to_fit(gameover_image, WIDTH, HEIGHT)
victory_image = scale_to_fit(victory_image, WIDTH, HEIGHT)

# Start / game-over / victory sounds
try:
    game_start_sound = pygame.mixer.Sound(("sounds/game-start-6104.mp3"))
    game_start_sound.set_volume(1.0)
except pygame.error:
    game_start_sound = None

try:
    game_over_sound = pygame.mixer.Sound(("sounds/game-over-arcade-6435.mp3"))
    game_over_sound.set_volume(1.0)
except pygame.error:
    game_over_sound = None

try:
    victory_fanfare_sound = pygame.mixer.Sound(
        ("sounds/brass-fanfare-with-timpani-and-winchimes-reverberated-146260.mp3")
    )
    victory_fanfare_sound.set_volume(1.0)
except pygame.error:
    victory_fanfare_sound = None

# Minotaur special sounds
try:
    minotaur_growl_sound = pygame.mixer.Sound(("sounds/monster-growl-140377.mp3"))
    minotaur_growl_sound.set_volume(1.0)
except pygame.error:
    minotaur_growl_sound = None

try:
    minotaur_kill_sword_sound = pygame.mixer.Sound(("sounds/violent-sword-slice-2-393841.mp3"))
    minotaur_kill_sword_sound.set_volume(1.0)
except pygame.error:
    minotaur_kill_sword_sound = None

try:
    minotaur_kill_scream_sound = pygame.mixer.Sound(("sounds/terrifying-scream-353210.mp3"))
    minotaur_kill_scream_sound.set_volume(1.0)
except pygame.error:
    minotaur_kill_scream_sound = None


class Player:
    def __init__(self, tile_x, tile_y):
        # Tile coordinates (force ints)
        self.tx = int(tile_x)
        self.ty = int(tile_y)

        # Pixel position (center of tile)
        self.x = self.tx * TILE_SIZE + TILE_SIZE // 2
        self.y = self.ty * TILE_SIZE + TILE_SIZE // 2

        # Current direction and buffered next direction
        self.dir = pygame.Vector2(0, 0)
        self.next_dir = pygame.Vector2(0, 0)

        # Speed should divide TILE_SIZE nicely (24 % 4 == 0)
        self.speed = 4

        # Rect used for drawing / pellet collision
        self.rect = pygame.Rect(0, 0, TILE_SIZE, TILE_SIZE)
        self.rect.center = (self.x, self.y)

        # Whether gates are open for movement
        self.gates_open = False

    def handle_input(self, keys):
        if keys[pygame.K_LEFT]:
            self.next_dir = pygame.Vector2(-1, 0)
        elif keys[pygame.K_RIGHT]:
            self.next_dir = pygame.Vector2(1, 0)
        elif keys[pygame.K_UP]:
            self.next_dir = pygame.Vector2(0, -1)
        elif keys[pygame.K_DOWN]:
            self.next_dir = pygame.Vector2(0, 1)

    def at_tile_center(self):
        return (
            (self.x - TILE_SIZE // 2) % TILE_SIZE == 0
            and (self.y - TILE_SIZE // 2) % TILE_SIZE == 0
        )

    def can_move(self, direction):
        if direction.length_squared() == 0:
            return False

        # Next tile (cast to int so we never index with floats)
        nx = int(self.tx + direction.x)
        ny = int(self.ty + direction.y)

        # Bounds check
        if not (0 <= nx < COLS and 0 <= ny < ROWS):
            return False

        tile = MAP_LAYOUT[ny][nx]

        # Wall always blocks
        if tile == "#":
            return False

        # Gates block until opened
        if tile == "G" and not self.gates_open:
            return False

        return True

    def update(self):
        # At tile center = allowed to turn/change direction
        if self.at_tile_center():
            # Sync tile coords from pixel coords (cast to int)
            self.tx = int((self.x - TILE_SIZE // 2) // TILE_SIZE)
            self.ty = int((self.y - TILE_SIZE // 2) // TILE_SIZE)

            # Try buffered turn first
            if self.can_move(self.next_dir):
                self.dir = self.next_dir

            # If current direction blocked, stop
            if not self.can_move(self.dir):
                self.dir = pygame.Vector2(0, 0)

        # Move along current direction
        self.x += self.dir.x * self.speed
        self.y += self.dir.y * self.speed

        # Update rect position
        self.rect.center = (int(self.x), int(self.y))

    def draw(self, surf):
        rect = theseus_image.get_rect(
            center=(int(self.x) + UI_PANEL_WIDTH, int(self.y))
        )
        surf.blit(theseus_image, rect)


class Human:
    def __init__(self, tile_x, tile_y):
        # Tile coordinates
        self.tx = int(tile_x)
        self.ty = int(tile_y)

        # Pixel position (center of tile)
        self.x = self.tx * TILE_SIZE + TILE_SIZE // 2
        self.y = self.ty * TILE_SIZE + TILE_SIZE // 2

        # Current movement direction
        self.dir = pygame.Vector2(0, 0)
        # Slower than player
        self.speed = 1.5

        # Rect used for collisions with Minotaur
        self.rect = pygame.Rect(0, 0, TILE_SIZE, TILE_SIZE)
        self.rect.center = (self.x, self.y)

        # Assign a random color (not yellow or red) – color unused now but kept
        self.color = self.random_color()

        # Gates open flag for movement
        self.gates_open = False

    @staticmethod
    def random_color():
        forbidden = {YELLOW, RED}
        while True:
            r = random.randint(50, 255)
            g = random.randint(50, 255)
            b = random.randint(50, 255)
            if (r, g, b) not in forbidden:
                return (r, g, b)

    def at_tile_center(self):
        return (
            (self.x - TILE_SIZE // 2) % TILE_SIZE == 0
            and (self.y - TILE_SIZE // 2) % TILE_SIZE == 0
        )

    def can_move(self, direction):
        if direction.length_squared() == 0:
            return False

        nx = int(self.tx + direction.x)
        ny = int(self.ty + direction.y)

        # Bounds check
        if not (0 <= nx < COLS and 0 <= ny < ROWS):
            return False

        tile = MAP_LAYOUT[ny][nx]

        if tile == "#":
            return False

        if tile == "G" and not self.gates_open:
            return False

        return True

    def update(self):
        # Choose a direction only at tile centers
        if self.at_tile_center():
            # Sync tile coords
            self.tx = int((self.x - TILE_SIZE // 2) // TILE_SIZE)
            self.ty = int((self.y - TILE_SIZE // 2) // TILE_SIZE)

            # Candidate directions
            dirs = [
                pygame.Vector2(1, 0),
                pygame.Vector2(-1, 0),
                pygame.Vector2(0, 1),
                pygame.Vector2(0, -1),
            ]
            possible = [d for d in dirs if self.can_move(d)]

            if possible:
                # Avoid immediately reversing direction if there is another option
                if self.dir.length_squared() != 0:
                    opposite = pygame.Vector2(-self.dir.x, -self.dir.y)
                    non_reverse = [d for d in possible if d != opposite]
                    if non_reverse:
                        possible = non_reverse
                self.dir = random.choice(possible)
            else:
                self.dir = pygame.Vector2(0, 0)

        # Move in current direction
        self.x += self.dir.x * self.speed
        self.y += self.dir.y * self.speed
        self.rect.center = (int(self.x), int(self.y))

    def draw(self, surf):
        rect = tribute_image.get_rect(
            center=(int(self.x) + UI_PANEL_WIDTH, int(self.y))
        )
        surf.blit(tribute_image, rect)


class Minotaur:
    def __init__(self, tile_x, tile_y):
        self.tx = int(tile_x)
        self.ty = int(tile_y)

        self.x = self.tx * TILE_SIZE + TILE_SIZE // 2
        self.y = self.ty * TILE_SIZE + TILE_SIZE // 2

        self.dir = pygame.Vector2(0, 0)
        self.speed = 3  # base movement speed

        # Load sprites
        self.image_normal = pygame.image.load(
            ("sprites/minotaur_normal.png")
        ).convert_alpha()
        self.image_scared = pygame.image.load(
            ("sprites/minotaur_scared.png")
        ).convert_alpha()
        self.image_dead = pygame.image.load(
            ("sprites/minotaur_dead.png")
        ).convert_alpha()

        # Make the minotaur visually larger than a single tile
        sprite_size = MINOTAUR_SIZE

        # Scale sprites to the larger size
        self.image_normal = pygame.transform.smoothscale(
            self.image_normal, (sprite_size, sprite_size)
        )
        self.image_scared = pygame.transform.smoothscale(
            self.image_scared, (sprite_size, sprite_size)
        )
        self.image_dead = pygame.transform.smoothscale(
            self.image_dead, (sprite_size, sprite_size)
        )

        # Current visual state: "normal", "scared", or "dead"
        self.state = "normal"

        # Use a bigger rect matching the sprite size, centered on the same x/y
        self.rect = pygame.Rect(0, 0, sprite_size, sprite_size)
        self.rect.center = (self.x, self.y)

        # Flee mode (after pellets cleared)
        self.flee = False

        # Gates open flag for movement
        self.gates_open = False

    def at_tile_center(self):
        return (
            (self.x - TILE_SIZE // 2) % TILE_SIZE == 0
            and (self.y - TILE_SIZE // 2) % TILE_SIZE == 0
        )

    def can_move_to(self, nx, ny):
        if not (0 <= nx < COLS and 0 <= ny < ROWS):
            return False
        tile = MAP_LAYOUT[ny][nx]
        if tile == "#":
            return False
        if tile == "G" and not self.gates_open:
            return False
        return True

    def update(self, player, humans):
        # Choose a new direction only at tile centers
        if self.at_tile_center():
            # sync tile coords
            self.tx = int((self.x - TILE_SIZE // 2) // TILE_SIZE)
            self.ty = int((self.y - TILE_SIZE // 2) // TILE_SIZE)

            from collections import deque

            start = (self.tx, self.ty)

            # Build goal set
            if self.flee:
                # Run away: choose a tile far from the player
                best_goal = None
                best_dist = -1
                for y, row in enumerate(MAP_LAYOUT):
                    for x, ch in enumerate(row):
                        if ch == "#":
                            continue
                        dx = x - player.tx
                        dy = y - player.ty
                        dist = dx * dx + dy * dy
                        if dist > best_dist:
                            best_dist = dist
                            best_goal = (x, y)
                if best_goal is None:
                    goals = {(player.tx, player.ty)}
                else:
                    goals = {best_goal}
            else:
                # Hunt nearest of player or humans
                goals = {(player.tx, player.ty)}
                for h in humans:
                    goals.add((h.tx, h.ty))

            # BFS to nearest goal
            queue = deque([start])
            came_from = {start: None}

            # 4-way movement: right, left, down, up
            directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
            reached = None

            while queue:
                cx, cy = queue.popleft()
                if (cx, cy) in goals:
                    reached = (cx, cy)
                    break

                for dx, dy in directions:
                    nx, ny = cx + dx, cy + dy
                    if (nx, ny) in came_from:
                        continue
                    if not self.can_move_to(nx, ny):
                        continue
                    came_from[(nx, ny)] = (cx, cy)
                    queue.append((nx, ny))

            # Reconstruct path: from reached goal back to start
            if reached is not None and reached != start:
                current = reached
                while came_from[current] != start:
                    current = came_from[current]
                next_x, next_y = current

                dx = next_x - self.tx
                dy = next_y - self.ty
                self.dir = pygame.Vector2(dx, dy)
            else:
                # Fallback: stop if no path found
                self.dir = pygame.Vector2(0, 0)

        # move along chosen direction
        self.x += self.dir.x * self.speed
        self.y += self.dir.y * self.speed

        self.rect.center = (int(self.x), int(self.y))

    def draw(self, surf):
        # Choose sprite based on state
        if self.state == "dead":
            image = self.image_dead
        elif self.flee:
            image = self.image_scared
        else:
            image = self.image_normal

        # Offset drawing by UI_PANEL_WIDTH so the maze is to the right of the panel
        screen_center = (self.rect.centerx + UI_PANEL_WIDTH, self.rect.centery)
        rect = image.get_rect(center=screen_center)
        surf.blit(image, rect)


def build_level():
    walls = []
    pellets = []
    gates = []
    player_start = (0, 0)  # tile coords
    minotaur_start = (0, 0)

    for row_idx, row in enumerate(MAP_LAYOUT):
        for col_idx, char in enumerate(row):
            x = col_idx * TILE_SIZE
            y = row_idx * TILE_SIZE

            if char == "#":
                walls.append(pygame.Rect(x, y, TILE_SIZE, TILE_SIZE))
            elif char in ".o":
                # pellet is a rect in the middle of the tile
                pellet_size = TILE_SIZE * 3 // 8
                offset = (TILE_SIZE - pellet_size) // 2
                pellets.append(
                    pygame.Rect(
                        x + offset,
                        y + offset,
                        pellet_size,
                        pellet_size,
                    )
                )
            elif char == "G":
                gates.append(pygame.Rect(x, y, TILE_SIZE, TILE_SIZE))
            elif char == "P":
                # store tile coordinates, not pixels
                player_start = (col_idx, row_idx)
            elif char == "M":
                minotaur_start = (col_idx, row_idx)

    return walls, pellets, gates, player_start, minotaur_start


def draw_level(surf, walls, pellets, gates, survivors_count, pellets_left, gates_open):
    # Clear UI panel on the left
    surf.fill(BLACK, (0, 0, UI_PANEL_WIDTH, HEIGHT))

    # Draw floor tiles across the maze area (shifted right by UI_PANEL_WIDTH)
    for row in range(ROWS):
        for col in range(COLS):
            x = UI_PANEL_WIDTH + col * TILE_SIZE
            y = row * TILE_SIZE
            surf.blit(floor_image, (x, y))

    # Draw walls using wall sprite (offset by UI_PANEL_WIDTH)
    for wall in walls:
        surf.blit(wall_image, (wall.x + UI_PANEL_WIDTH, wall.y))

    # Draw gates using locked/open sprites (offset by UI_PANEL_WIDTH)
    for gate in gates:
        img = gate_open_image if gates_open else gate_locked_image
        surf.blit(img, (gate.x + UI_PANEL_WIDTH, gate.y))

    # Draw pellets as bright green circles (offset by UI_PANEL_WIDTH)
    for pellet in pellets:
        center = (pellet.centerx + UI_PANEL_WIDTH, pellet.centery)
        pygame.draw.circle(surf, GREEN, center, pellet.width // 2)

    # Optional separator line between UI panel and maze
    pygame.draw.line(
        surf, WHITE, (UI_PANEL_WIDTH - 1, 0), (UI_PANEL_WIDTH - 1, HEIGHT), 2
    )

    # Draw HUD: survivors and guidance at the top of the UI panel
    hud_y = 10
    survivors_surf = font.render(f"Survivors: {survivors_count}", True, WHITE)

    if pellets_left > 0:
        # Still collecting
        pellets_text = f"Pellets left: {pellets_left}"
    elif not gates_open:
        # All pellets eaten, Minotaur still alive
        pellets_text = "Slay the Minotaur!"
    else:
        # All pellets eaten and Minotaur slain, gates are open
        pellets_text = "Exit the Labyrinth!"

    pellets_surf = font.render(pellets_text, True, WHITE)
    surf.blit(survivors_surf, (10, hud_y))
    surf.blit(pellets_surf, (10, hud_y + 25))

    pellets_surf = font.render(pellets_text, True, WHITE)
    surf.blit(survivors_surf, (10, hud_y))
    surf.blit(pellets_surf, (10, hud_y + 25))

    # Controls / instructions below the HUD
    controls_y = hud_y + 60
    controls_title = font.render("Controls:", True, WHITE)
    move_line = font.render("Arrow keys - move", True, WHITE)
    restart_line = font.render("R - restart", True, WHITE)
    quit_line = font.render("Q - quit", True, WHITE)
    surf.blit(controls_title, (10, controls_y))
    surf.blit(move_line, (10, controls_y + 20))
    surf.blit(restart_line, (10, controls_y + 40))
    surf.blit(quit_line, (10, controls_y + 60))

    # Credits under the controls
    credits_y = controls_y + 100
    author_line = font.render("Kuzey Ozturac", True, WHITE)
    date_line = font.render("29 Nov 2025", True, WHITE)
    surf.blit(author_line, (10, credits_y))
    surf.blit(date_line, (10, credits_y + 20))


def show_game_over():
    rect = gameover_image.get_rect(center=(WIDTH // 2, HEIGHT // 2))
    screen.blit(gameover_image, rect)
    pygame.display.flip()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return "quit"
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    return "quit"
                elif event.key == pygame.K_r:
                    return "restart"


def show_win_screen():
    rect = victory_image.get_rect(center=(WIDTH // 2, HEIGHT // 2))
    screen.blit(victory_image, rect)
    pygame.display.flip()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return "quit"
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    return "quit"
                elif event.key == pygame.K_r:
                    return "restart"


def main():
    # Play game start sound on each new run
    if game_start_sound is not None:
        game_start_sound.play()

    walls, pellets, gates, player_start, minotaur_start = build_level()
    player = Player(*player_start)

    minotaur = Minotaur(*minotaur_start)

    # Nine additional human tributes wandering the labyrinth
    human_start_tiles = [
        (1, 1),
        (26, 1),
        (1, 20),
        (26, 20),
        (1, 23),
        (26, 23),
        (13, 5),
        (14, 5),
        (13, 26),
    ]
    humans = [Human(tx, ty) for (tx, ty) in human_start_tiles]

    score = 0
    running = True
    dead = False
    won = False

    # New state flags
    minotaur_alive = True
    minotaur_flee = False
    gates_open = False
    minotaur_flee_announced = False

    while running:
        clock.tick(FPS)

        # --- Events ---
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return "quit"
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    return "quit"
                elif event.key == pygame.K_r:
                    return "restart"

        # Keep everyone informed about gate status
        player.gates_open = gates_open
        for h in humans:
            h.gates_open = gates_open
        minotaur.gates_open = gates_open

        if not dead and not won:
            keys = pygame.key.get_pressed()
            player.handle_input(keys)
            player.update()

            for human in humans:
                human.update()

            if minotaur_alive:
                minotaur.flee = minotaur_flee
                # Update visual state based on flee mode
                if minotaur_flee:
                    minotaur.state = "scared"
                else:
                    minotaur.state = "normal"
                minotaur.update(player, humans)

            # Eat pellets
            eaten = []
            for pellet in pellets:
                if player.rect.colliderect(pellet):
                    eaten.append(pellet)
                    score += 10
                    # Play a random pellet sound if available
                    if pellet_sounds:
                        random.choice(pellet_sounds).play()
            for pellet in eaten:
                pellets.remove(pellet)

            # Once all pellets are gone, minotaur starts fleeing
            if not pellets and minotaur_alive and not minotaur_flee:
                minotaur_flee = True
                if not minotaur_flee_announced and minotaur_growl_sound is not None:
                    minotaur_growl_sound.play()
                minotaur_flee_announced = True

            # Check player / minotaur interaction
            if minotaur_alive and player.rect.colliderect(minotaur.rect):
                if minotaur_flee:
                    # Player kills the minotaur -> gates open
                    minotaur_alive = False
                    gates_open = True
                    minotaur.state = "dead"
                    # Play kill sounds
                    if minotaur_kill_sword_sound is not None:
                        minotaur_kill_sword_sound.play()
                    if minotaur_kill_scream_sound is not None:
                        minotaur_kill_scream_sound.play()
                else:
                    # Normal phase: minotaur kills you
                    dead = True
                    if game_over_sound is not None:
                        game_over_sound.play()

            # Minotaur hunts humans only while alive and not fleeing
            if minotaur_alive and not minotaur_flee:
                survivors = []
                before_count = len(humans)
                for h in humans:
                    if not minotaur.rect.colliderect(h.rect):
                        survivors.append(h)
                killed = before_count - len(survivors)
                if killed > 0:
                    # Play both eat and scream sounds if available
                    if minotaur_eat_sound is not None:
                        minotaur_eat_sound.play()
                    if minotaur_scream_sound is not None:
                        minotaur_scream_sound.play()
                humans = survivors

            # Escape through an open gate = win
            if gates_open:
                for gate in gates:
                    if player.rect.colliderect(gate):
                        won = True
                        if victory_fanfare_sound is not None:
                            victory_fanfare_sound.play()
                        break

        # --- Draw ---
        # Survivors = remaining humans + Theseus if he is still alive
        survivors_count = len(humans) + (0 if dead else 1)
        pellets_left = len(pellets)
        draw_level(screen, walls, pellets, gates, survivors_count, pellets_left, gates_open)
        if not dead:
            player.draw(screen)
        for human in humans:
            human.draw(screen)
        minotaur.draw(screen)

        if dead:
            action = show_game_over()
            return action
        elif won:
            action = show_win_screen()
            return action

        pygame.display.flip()

    return "quit"


if __name__ == "__main__":
    # On web (pygbag / emscripten), just run main() once and never sys.exit()
    if sys.platform == "emscripten":
        main()
    else:
        while True:
            action = main()
            if action == "quit":
                break
        pygame.quit()
        sys.exit()
