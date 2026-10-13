// Ribbit Race Versus responsibility: 62 versus cpu
    function getPvpCpuChargedPathThreat(cpu, opponent) {
      if (!cpu || !opponent || !opponent.grounded || !opponent.charging || opponent.bonked || opponent.stunTimer > 0) return 0;
      const power = clamp(opponent.charge, 0.04, 1);
      let x = opponent.x;
      let y = opponent.y;
      let vx = opponent.dir * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      let vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      let threat = 0;
      for (let t = 0.04; t <= 1.35; t += 0.04) {
        vy += CONFIG.gravity * 0.04;
        x += vx * 0.04;
        y += vy * 0.04;
        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        else if (x + opponent.w >= W) { x = W - opponent.w; vx = -Math.abs(vx); }
        const overlap = x + opponent.w * 0.80 > cpu.x && x + opponent.w * 0.20 < cpu.x + cpu.w;
        const feet = y + opponent.h;
        const aboveHead = feet <= cpu.y + 8 && cpu.y - feet <= 84;
        if (overlap && aboveHead && vy > -30) {
          const proximity = 1 - clamp((cpu.y - feet) / 84, 0, 1);
          threat = Math.max(threat, 0.48 + proximity * 0.52);
        }
      }
      return clamp(threat, 0, 1);
    }

    function getPvpCpuBonkThreat(cpu, opponent) {
      if (!cpu || !opponent || opponent.bonked || opponent.stunTimer > 0) return 0;
      const cpuCenter = cpu.x + cpu.w / 2;
      const opponentCenter = opponent.x + opponent.w / 2;
      const horizontalDistance = Math.abs(opponentCenter - cpuCenter);
      const opponentBottom = opponent.y + opponent.h;
      const verticalGap = cpu.y - opponentBottom;
      const standingPlatform = opponent.grounded ? getPvpStandingPlatform(opponent) : null;
      const directlyAbovePlatform = Boolean(
        standingPlatform && !standingPlatform.ground &&
        verticalGap >= -5 && verticalGap <= 92 &&
        horizontalDistance <= Math.max(34, standingPlatform.w * 0.42)
      );
      const fallingAbove = Boolean(
        !opponent.grounded && opponent.vy > -20 &&
        verticalGap >= -8 && verticalGap <= 74 &&
        horizontalDistance <= 38 + Math.abs(opponent.vx) * 0.10
      );
      const chargedPathThreat = getPvpCpuChargedPathThreat(cpu, opponent);
      if (!directlyAbovePlatform && !fallingAbove) return chargedPathThreat;
      const verticalUrgency = 1 - clamp((verticalGap + 8) / 100, 0, 1);
      const horizontalUrgency = 1 - clamp(horizontalDistance / 58, 0, 1);
      return Math.max(chargedPathThreat, clamp(0.35 + verticalUrgency * 0.42 + horizontalUrgency * 0.38, 0, 1));
    }

    function getPvpCpuRebonkOpportunity(cpu, opponent) {
      if (!cpu || !opponent || opponent.bonked) return 0;
      const leavingStun = opponent.stunTimer > 0 && opponent.stunTimer <= 1.15;
      const justRecovered = opponent.stunTimer <= 0 && Number.isFinite(opponent.lastStunEndAt) && game.pvpElapsed - opponent.lastStunEndAt <= 0.75;
      if (!leavingStun && !justRecovered) return 0;
      const direction = cpu.dir >= 0 ? 1 : -1;
      const forwardDistance = (opponent.x + opponent.w / 2 - (cpu.x + cpu.w / 2)) * direction;
      if (forwardDistance < -10 || forwardDistance > 230) return 0;
      const distanceScore = 1 - clamp(Math.abs(forwardDistance - 76) / 170, 0, 1);
      const urgency = leavingStun ? 1 - clamp(opponent.stunTimer / 1.15, 0, 1) : 1;
      return clamp(0.52 + distanceScore * 0.34 + urgency * 0.28, 0, 1);
    }

    function getPvpCpuBonkOpportunity(cpu, opponent) {
      if (!cpu || !opponent || opponent.bonked) return 0;
      const rebonkOpportunity = getPvpCpuRebonkOpportunity(cpu, opponent);
      if (opponent.stunTimer > 1.15) return rebonkOpportunity;
      const direction = cpu.dir >= 0 ? 1 : -1;
      const forwardDistance = (opponent.x + opponent.w / 2 - (cpu.x + cpu.w / 2)) * direction;
      const verticalDifference = cpu.y - opponent.y;
      if (forwardDistance < -8 || forwardDistance > 210) return 0;
      const opponentStable = opponent.grounded || Math.abs(opponent.vy) < 85;
      if (!opponentStable) return 0.15;
      const distanceScore = 1 - clamp(Math.abs(forwardDistance - 82) / 150, 0, 1);
      const heightScore = 1 - clamp(Math.abs(verticalDifference) / 110, 0, 1);
      return Math.max(rebonkOpportunity, clamp(distanceScore * 0.68 + heightScore * 0.32, 0, 1));
    }

    function simulatePvpCpuJump(cpu, targetFly, opponent, direction, power, skill) {
      const step = 0.025;
      const maxTime = 1.85;
      let x = cpu.x;
      let y = cpu.y;
      let simDirection = direction >= 0 ? 1 : -1;
      let vx = simDirection * lerp(CONFIG.minimumJumpX, CONFIG.maximumJumpX, power);
      let vy = -lerp(CONFIG.minimumJumpY, CONFIG.maximumJumpY, power);
      let previousBottom = y + cpu.h;
      let minFlyDistance = Infinity;
      let catchReward = 0;
      let bonkReward = 0;
      let predictedBonkTime = null;
      let bonkRiskPenalty = 0;
      let platformReward = 0;
      let reboundReward = 0;
      let predictedRebound = false;
      let wallPenalty = 0;
      let landedPlatform = null;
      let landedPlatformY = null;
      let elapsed = 0;
      const correctX = Number(targetFly?.baseX);
      const correctY = Number(targetFly?.baseY);
      const hasFly = Number.isFinite(correctX) && Number.isFinite(correctY);

      for (elapsed = step; elapsed <= maxTime; elapsed += step) {
        vy += CONFIG.gravity * step;
        x += vx * step;
        y += vy * step;
        if (x <= 0) {
          x = 0;
          vx = Math.abs(vx);
          simDirection = 1;
          wallPenalty += 18;
        } else if (x + cpu.w >= W) {
          x = W - cpu.w;
          vx = -Math.abs(vx);
          simDirection = -1;
          wallPenalty += 18;
        }

        const mouthX = simDirection > 0 ? x + cpu.w - 2 : x + 2;
        const mouthY = y + 5;
        if (hasFly) {
          const flyDx = correctX - mouthX;
          const flyDy = correctY - mouthY;
          const distance = Math.abs(flyDx) + Math.abs(flyDy) * 1.15;
          minFlyDistance = Math.min(minFlyDistance, distance);
          const inFront = flyDx * simDirection >= -3;
          if (inFront && Math.abs(flyDx) <= CONFIG.tongueReach && Math.abs(flyDy) <= CONFIG.tongueVerticalTolerance) {
            catchReward = Math.max(catchReward, 1280 - elapsed * 110 - distance * 4);
          } else if (Math.abs(flyDx) <= 8 && Math.abs(flyDy) <= 9) {
            catchReward = Math.max(catchReward, 900 - elapsed * 95 - distance * 3);
          }
        }

        if (opponent && elapsed >= CONFIG.pvpMinFootstoolAirTime) {
          const opponentX = clamp(opponent.x + (opponent.grounded ? 0 : opponent.vx * elapsed), 0, W - opponent.w);
          const opponentY = opponent.grounded
            ? opponent.y
            : opponent.y + opponent.vy * elapsed + 0.5 * CONFIG.gravity * elapsed * elapsed;
          const opponentVy = opponent.grounded ? 0 : opponent.vy + CONFIG.gravity * elapsed;
          const overlap = x + cpu.w * 0.78 > opponentX && x + cpu.w * 0.22 < opponentX + opponent.w;
          const aboveHead = y + cpu.h >= opponentY - 5 && y + cpu.h <= opponentY + opponent.h * 0.55;
          if (overlap && aboveHead && vy > 45) {
            const dropHeight = Math.max(0, cpu.jumpStartY - y);
            bonkReward = Math.max(bonkReward, 260 + skill * 620 + dropHeight * 1.4);
            if (!Number.isFinite(predictedBonkTime)) predictedBonkTime = elapsed;
          }

          const opponentBottom = opponentY + opponent.h;
          const cpuHead = y;
          const opponentAboveCpu = opponentBottom <= cpuHead + 8 && cpuHead - opponentBottom <= 72;
          if (overlap && opponentAboveCpu && opponentVy > 15) {
            const proximity = 1 - clamp((cpuHead - opponentBottom) / 72, 0, 1);
            bonkRiskPenalty = Math.max(bonkRiskPenalty, 420 + skill * 620 + proximity * 420);
          }

          // A side collision is a legal way for the CPU to reverse direction.
          // Simulating the rebound lets it intentionally intercept a fly behind it
          // or block the opponent rather than waiting for a wall.
          const centerSeparation = Math.abs((y + cpu.h / 2) - (opponentY + opponent.h / 2));
          const sideCollision = overlap && !aboveHead && centerSeparation < 8 && Math.abs(vx) > 30;
          if (sideCollision && !predictedRebound) {
            predictedRebound = true;
            vx = -vx;
            simDirection *= -1;
            x = clamp(x + simDirection * 3, 0, W - cpu.w);
            const targetWasBehind = hasFly && (correctX - (cpu.x + cpu.w / 2)) * direction < -8;
            const opponentBlocksFly = hasFly && Math.abs(opponentX - correctX) < Math.abs(x - correctX);
            reboundReward = 280 + skill * 360 + (targetWasBehind ? 900 : 0) + (opponentBlocksFly ? 260 : 0);
          }
        }

        const bottom = y + cpu.h;
        if (vy >= 0) {
          let landed = false;
          for (const platform of platforms) {
            if (!platform || platform.ground) continue;
            const predictedPlatform = getPredictedPvpPlatformRect(platform, elapsed);
            if (previousBottom > predictedPlatform.y + 2 || bottom < predictedPlatform.y) continue;
            if (x + cpu.w <= predictedPlatform.x || x >= predictedPlatform.x + predictedPlatform.w) continue;
            const targetHeightFit = hasFly ? Math.max(0, 150 - Math.abs(correctY - predictedPlatform.y)) * 0.22 : 0;
            const movementBonus = platform.moving ? 120 + skill * 110 : 0;
            platformReward = Math.max(platformReward, 32 + targetHeightFit + movementBonus);
            y = predictedPlatform.y - cpu.h;
            landedPlatform = platform;
            landedPlatformY = predictedPlatform.y;
            landed = true;
            break;
          }
          if (landed || bottom >= CONFIG.groundY) break;
        }
        previousBottom = bottom;
      }

      const approachReward = Number.isFinite(minFlyDistance) ? 520 / (1 + minFlyDistance * 0.08) : 0;
      const heightFitReward = hasFly ? Math.max(0, 100 - Math.abs((cpu.y - correctY) - power * 160) * 0.45) : 0;
      const chargeReward = 35 + power * 45; // Reward purposeful charge instead of random tapping.
      const noise = (Math.random() - 0.5) * lerp(240, 8, skill);
      return {
        direction,
        power,
        score: catchReward + approachReward + heightFitReward + chargeReward + bonkReward + platformReward + reboundReward - wallPenalty - bonkRiskPenalty + noise,
        targetFlyId: targetFly?.id ?? null,
        predictedCatch: catchReward > 0,
        predictedBonk: bonkReward > 0,
        predictedBonkTime,
        predictedRebound,
        predictedBonkRisk: bonkRiskPenalty > 0,
        landedPlatform,
        landedPlatformY,
        landedOnMovingPlatform: Boolean(landedPlatform?.moving),
        landedOnVerticalLift: Boolean(landedPlatform?.moving && landedPlatform.movementAxis === "y")
      };
    }

    function choosePvpCpuPlan(cpu) {
      const skill = clamp((game.pvpCpuDifficulty || 1) / 9, 1 / 9, 1);
      const opponent = pvpPlayers[1-getPvpCpuIndex()];
      const matchingFlies = flies.filter((fly) => fly && fly.state === "active" && flyMatchesPrompt(fly));
      const onScreenMatchingFlies = matchingFlies.filter((fly) => fly.baseX >= -8 && fly.baseX <= W + 8 && fly.baseY >= -8 && fly.baseY <= CONFIG.playBottom + 8);
      const centerX = cpu.x + cpu.w / 2;
      onScreenMatchingFlies.sort((a, b) => {
        const aDistance = Math.abs(a.baseX - centerX) + Math.abs(a.baseY - cpu.y) * 0.68;
        const bDistance = Math.abs(b.baseX - centerX) + Math.abs(b.baseY - cpu.y) * 0.68;
        return aDistance - bDistance;
      });
      const targetCount = skill < 0.35 ? 1 : skill < 0.72 ? Math.min(2, onScreenMatchingFlies.length) : Math.min(3, onScreenMatchingFlies.length);
      const candidates = onScreenMatchingFlies.slice(0, targetCount);
      const basePowerSets = skill < 0.25
        ? [0.30, 0.54, 0.82]
        : skill < 0.55
          ? [0.24, 0.38, 0.52, 0.66, 0.80, 0.94]
          : [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0];
      let best = null;
      const lockedDirection = cpu.dir >= 0 ? 1 : -1;
      const overheadThreat = getPvpCpuBonkThreat(cpu, opponent);
      const bonkOpportunity = getPvpCpuBonkOpportunity(cpu, opponent);
      const rebonkOpportunity = getPvpCpuRebonkOpportunity(cpu, opponent);
      const selfBonkTrapOpportunity = getPvpCpuSelfBonkTrapOpportunity(cpu, opponent, onScreenMatchingFlies.length);

      if (selfBonkTrapOpportunity > 0.58 && game.pvpElapsed >= (Number(cpu.cpuTrapBailUntil) || -Infinity)) {
        return {
          direction: lockedDirection,
          power: 0.04,
          score: 12000 + selfBonkTrapOpportunity * 1400,
          targetFlyId: null,
          predictedCatch: false,
          predictedBonk: false,
          predictedRebound: false,
          predictedBonkRisk: false,
          waitForSelfBonk: true,
          reactionDelay: 0.04,
          releaseTolerance: 0.03
        };
      }

      // A re-bonk is only useful after the previous stun has actually ended.
      // Estimate charge time plus flight time, then delay the button press so
      // the CPU's feet arrive just after the recovery frame instead of landing
      // harmlessly on an opponent who is still stunned.
      const stunRemaining = Math.max(0, Number(opponent?.stunTimer) || 0);
      const justRecovered = Boolean(
        opponent && stunRemaining <= 0 && Number.isFinite(opponent.lastStunEndAt) &&
        game.pvpElapsed - opponent.lastStunEndAt <= 0.75
      );
      if (opponent && rebonkOpportunity > 0.12 && (stunRemaining > 0 || justRecovered)) {
        const rebonkPowers = skill < 0.45
          ? [0.38, 0.56, 0.74, 0.92]
          : [0.26, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.90, 1.0];
        for (const power of rebonkPowers) {
          const plan = simulatePvpCpuJump(cpu, null, opponent, lockedDirection, power, skill);
          if (!plan.predictedBonk || !Number.isFinite(plan.predictedBonkTime)) continue;
          const chargeTime = Math.max(0, power - 0.04) * CONFIG.chargeSecondsOneWay;
          const naturalContactTime = chargeTime + plan.predictedBonkTime;
          const desiredContactTime = stunRemaining > 0 ? stunRemaining + 0.045 : 0.055;
          const launchDelay = Math.max(0, desiredContactTime - naturalContactTime);
          const finalContactTime = naturalContactTime + launchDelay;
          const timingError = Math.abs(finalContactTime - desiredContactTime);
          plan.rebonkPlan = true;
          plan.rebonkLaunchDelay = launchDelay;
          plan.score += 5200 + skill * 1850 + rebonkOpportunity * 1100 - timingError * 2400;
          if (finalContactTime < stunRemaining + 0.025) plan.score -= 6500;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      // Garden's upper fly row cannot be reached reliably from the ground.
      // If a high target is active, first route the CPU onto a side elevator,
      // then wait until that lift has carried it high enough to make the catch.
      const highGardenTarget = game.selectedLevelId === "garden"
        ? candidates.find((fly) => Number(fly.baseY) <= 100) || null
        : null;
      const cpuStandingPlatform = getPvpStandingPlatform(cpu);
      const cpuOnGardenLift = Boolean(
        highGardenTarget &&
        cpuStandingPlatform?.moving &&
        cpuStandingPlatform.movementAxis === "y"
      );

      if (cpuOnGardenLift) {
        const currentLift = getPredictedPvpPlatformRect(cpuStandingPlatform, 0.12);
        if (currentLift.y > 126) {
          return {
            direction: lockedDirection,
            power: 0.04,
            score: 9000,
            targetFlyId: highGardenTarget.id,
            predictedCatch: false,
            predictedBonk: false,
            predictedRebound: false,
            predictedBonkRisk: false,
            waitOnElevator: true,
            reactionDelay: 0.08,
            releaseTolerance: 0.03
          };
        }
      } else if (highGardenTarget) {
        const elevators = platforms.filter((platform) => platform?.moving && platform.movementAxis === "y");
        const elevatorPowers = skill < 0.45
          ? [0.32, 0.48, 0.64, 0.80]
          : [0.24, 0.34, 0.44, 0.54, 0.64, 0.74, 0.84, 0.94];
        elevators.forEach((elevator, elevatorIndex) => {
          const predictedLift = getPredictedPvpPlatformRect(elevator, 0.72);
          const waypoint = {
            id: highGardenTarget.id,
            baseX: predictedLift.x + predictedLift.w / 2,
            baseY: predictedLift.y - 8
          };
          elevatorPowers.forEach((power) => {
            const plan = simulatePvpCpuJump(cpu, waypoint, opponent, lockedDirection, power, skill);
            plan.targetFlyId = highGardenTarget.id;
            plan.elevatorPlan = true;
            const liftCenter = predictedLift.x + predictedLift.w / 2;
            const forwardLift = (liftCenter - centerX) * lockedDirection >= -6;
            if (plan.landedOnVerticalLift) {
              plan.score += 2600 + skill * 1600 + (forwardLift ? 340 : 0) - elevatorIndex * 3;
            } else {
              plan.score -= 1100;
            }
            if (!best || plan.score > best.score) best = plan;
          });
        });
      }

      // When an opponent is poised above the CPU, test compact evasive hops
      // before ordinary fly routes. These hops move the CPU out from under the
      // threat without requiring it to turn around.
      if (overheadThreat > 0.12) {
        const defensiveTarget = candidates[0] || null;
        for (const power of [0.18, 0.22, 0.27, 0.33, 0.39]) {
          const plan = simulatePvpCpuJump(cpu, defensiveTarget, opponent, lockedDirection, power, skill);
          plan.defensiveHop = true;
          plan.score += overheadThreat * (1450 - power * 620);
          if (plan.predictedBonkRisk) plan.score -= 900;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      // Evaluate deliberate footstool routes even when the best vocabulary fly
      // is elsewhere. A skilled CPU takes the bonk when the opponent is exposed.
      if (bonkOpportunity > 0.12 && (!opponent || opponent.stunTimer <= 0)) {
        const bonkPowers = skill < 0.45 ? [0.42, 0.62, 0.82] : [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0];
        for (const power of bonkPowers) {
          const plan = simulatePvpCpuJump(cpu, null, opponent, lockedDirection, power, skill);
          plan.bonkPlan = true;
          if (plan.predictedBonk) plan.score += 1250 + skill * 1150 + bonkOpportunity * 650 + rebonkOpportunity * 1550;
          else plan.score -= 420 + skill * 280;
          if (plan.predictedBonkRisk) plan.score -= 750;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      const targetBehind = candidates.find((target) => (target.baseX - centerX) * lockedDirection < -8) || null;
      const playerFacingBehindTarget = Boolean(
        targetBehind && opponent &&
        (targetBehind.baseX - (opponent.x + opponent.w / 2)) * opponent.dir > 0
      );
      const needsRebound = Boolean(targetBehind) || (!candidates.length && opponent && !opponent.bonked && opponent.stunTimer <= 0);
      if (needsRebound && opponent) {
        const reboundPowers = skill < 0.45 ? [0.40, 0.62, 0.84] : [0.28,0.38,0.48,0.58,0.68,0.78,0.88,0.98];
        for (const power of reboundPowers) {
          const plan = simulatePvpCpuJump(cpu, targetBehind, opponent, lockedDirection, power, skill);
          plan.reboundPlan = true;
          plan.interceptPlayerForTurnaround = playerFacingBehindTarget;
          if (plan.predictedRebound) {
            plan.score += 1150 + skill * 1200 + (playerFacingBehindTarget ? 2600 + skill * 1400 : 0);
          } else {
            plan.score -= playerFacingBehindTarget ? 1250 : 520;
          }
          if (plan.predictedBonkRisk) plan.score -= 850;
          if (!best || plan.score > best.score) best = plan;
        }
      }

      for (const target of candidates) {
        const centerY = cpu.y + cpu.h / 2;
        const forwardDistance = (target.baseX - centerX) * lockedDirection;
        const verticalRise = Math.max(0, centerY - target.baseY);
        const estimatedHorizontalPower = clamp(Math.sqrt(Math.max(0, Math.abs(forwardDistance) - CONFIG.tongueReach * 0.45) / 255), 0.20, 1);
        const estimatedVerticalPower = clamp((verticalRise + 18) / 190, 0.22, 1);
        const estimatedPower = clamp(Math.max(estimatedHorizontalPower, estimatedVerticalPower), 0.22, 1);
        const adaptivePowers = skill >= 0.55
          ? [estimatedPower - 0.18, estimatedPower - 0.10, estimatedPower - 0.04, estimatedPower, estimatedPower + 0.05, estimatedPower + 0.12, estimatedPower + 0.20]
          : [];
        const powerSets = [...new Set([...basePowerSets, ...adaptivePowers]
          .map((value) => Math.round(clamp(value, 0.18, 1) * 100) / 100))];
        for (const power of powerSets) {
          const plan = simulatePvpCpuJump(cpu, target, opponent, lockedDirection, power, skill);
          const secondFlyBonus = onScreenMatchingFlies.some((other) => other.id !== target.id && Math.abs(other.baseX - target.baseX) <= 62 && Math.abs(other.baseY - target.baseY) <= 46) ? 165 + skill * 180 : 0;
          // Skilled CPUs strongly prefer a real catch trajectory over repeated tiny hops.
          if (plan.predictedBonk) plan.score += 420 + skill * 680 + bonkOpportunity * 280;
          if (plan.predictedCatch) plan.score += 420 + skill * 520 + secondFlyBonus;
          else plan.score -= skill * 520;
          plan.score -= Math.abs(power - estimatedPower) * lerp(20, 150, skill);
          if (power < estimatedPower * 0.72) plan.score -= lerp(35, 380, skill);
          if (!best || plan.score > best.score) best = plan;
        }
      }
      if (!best) {
        best = simulatePvpCpuJump(cpu, null, opponent, lockedDirection, skill < 0.45 ? 0.38 : 0.52, skill);
        best.score += 30;
      }
      const reaction = lerp(0.42, 0.035, skill);
      best.releaseTolerance = lerp(0.12, 0.025, skill);
      best.reactionDelay = best.rebonkPlan
        ? Math.max(0, Number(best.rebonkLaunchDelay) || 0)
        : reaction * (0.7 + Math.random() * 0.6);
      return best;
    }

    function shouldCpuUseHighGroundShortHop(cpu, opponent) {
      if (!cpu || !opponent || (game.pvpCpuDifficulty || 1) < 5 || !cpu.grounded || cpu.charging || cpu.bonked || cpu.stunTimer > 0) return false;
      const cpuPlatform = getPvpStandingPlatform(cpu);
      if (!cpuPlatform || cpuPlatform.ground) return false;
      if (!opponent.grounded || opponent.bonked || opponent.stunTimer > 0) return false;
      const horizontalDistance = Math.abs((opponent.x + opponent.w / 2) - (cpu.x + cpu.w / 2));
      const verticalGap = opponent.y - cpu.y;
      return verticalGap >= 10 && verticalGap <= 135 && horizontalDistance <= Math.max(18, cpuPlatform.w * 0.22);
    }

    function getCpuHighGroundShortHopPlan(cpu, opponent) {
      const cpuCenter = cpu.x + cpu.w / 2;
      const opponentCenter = opponent.x + opponent.w / 2;
      let direction = cpuCenter <= opponentCenter ? -1 : 1;
      if (cpu.x < 42) direction = 1;
      if (cpu.x + cpu.w > W - 42) direction = -1;
      const skill = clamp((game.pvpCpuDifficulty || 1) / 9, 1 / 9, 1);
      return { direction, power: lerp(0.24, 0.38, skill), releaseTolerance: 0.045, reactionDelay: 0, defensiveHop: true };
    }

    function updatePvpCpuInput(dt) {
      if (!game.pvpCpuEnabled || game.mode !== "pvp" || game.state !== "playing" || game.pvpTimerGraceActive || game.pvpTimedOutcomePending) return;
      const cpu = pvpPlayers[getPvpCpuIndex()];
      if (!cpu) return;
      game.pvpCpuEvasionCooldownFrames = Math.max(0, (game.pvpCpuEvasionCooldownFrames || 0) - 1);
      if (cpu.bonked || cpu.stunTimer > 0 || game.pvpWinPendingIndex !== null) {
        cpu.cpuHoldChargeTrap = false;
        cpu.inputHeld = false;
        cpu.charging = false;
        game.pvpCpuPlan = null;
        return;
      }

      game.pvpCpuDecisionTimer = Math.max(0, (game.pvpCpuDecisionTimer || 0) - dt);
      if (cpu.charging) {
        cpu.dir = cpu.chargeFacingDir >= 0 ? 1 : -1;
        // A skipped/trap decision can clear inputHeld without ending the charge.
        // The next release then silently fails and leaves the CPU charging
        // forever. Reconnect the charge to its virtual held key so it can
        // always release into a real launch, including the tutorial finale.
        if (!cpu.inputHeld) cpu.inputHeld = true;
      }
      if (!cpu.grounded) return;

      const opponent = pvpPlayers[1-getPvpCpuIndex()];
      if (Number(cpu.cpuSelfBonkBonusUntil) > game.pvpElapsed) {
        const chaseDirection = opponent && (opponent.x + opponent.w / 2) >= (cpu.x + cpu.w / 2) ? 1 : -1;
        const actualDirection=cpu.dir>=0?1:-1;
        game.pvpCpuPlan = { direction: actualDirection, power: clamp(0.34 + (game.pvpCpuDifficulty || 1) * 0.02, 0.34, 0.52), releaseTolerance: 0.04, reactionDelay: 0 };
        pressPvpButton(cpu.index, "cpu");
        cpu.cpuSelfBonkBonusUntil = -Infinity;
        return;
      }
      if (shouldCpuUseHighGroundShortHop(cpu, opponent)) {
        const shortHopPlan = getCpuHighGroundShortHopPlan(cpu, opponent);
        shortHopPlan.direction=cpu.dir>=0?1:-1;
        game.pvpCpuPlan = shortHopPlan;
        pressPvpButton(cpu.index, "cpu");
        return;
      }
      const matchingFlyCount = flies.filter((fly) => fly && fly.state === "active" && flyMatchesPrompt(fly)).length;
      const selfBonkTrapOpportunity = getPvpCpuSelfBonkTrapOpportunity(cpu, opponent, matchingFlyCount);
      const trapCooldownActive = game.pvpElapsed < (Number(cpu.cpuTrapBailUntil) || -Infinity);
      const trapStillActive = !trapCooldownActive && (selfBonkTrapOpportunity > 0.58 || (
        cpu.cpuHoldChargeTrap && isPvpCpuHighGroundTrapStillActive(cpu, opponent)
      ));
      if (trapStillActive) {
        const playerClearlyIdle = Boolean(
          opponent && opponent.grounded && !opponent.charging && !opponent.inputHeld &&
          Math.abs(opponent.vx || 0) < 1 && game.pvpElapsed - (Number(opponent.lastHumanInputAt) || -Infinity) > 0.75
        );
        const cpuBehind = Number(cpu.score || 0) < Number(opponent?.score || 0);
        cpu.cpuTrapIdleTime = playerClearlyIdle ? (Number(cpu.cpuTrapIdleTime) || 0) + dt : 0;
        const idleLimit = cpuBehind ? 2.4 : 3.6;
        if (cpu.cpuTrapIdleTime >= idleLimit) {
          cpu.cpuTrapIdleTime = 0;
          cpu.cpuTrapBailUntil = game.pvpElapsed + 2.25;
          cpu.cpuHoldChargeTrap = false;
          game.pvpCpuPlan = null;
          game.pvpCpuDecisionTimer = 0.03;
          // Release the held meter into a real route rather than cancelling it,
          // so the CPU immediately abandons the camping position.
          if (cpu.charging) releasePvpButton(cpu.index, "cpu");
          else cpu.inputHeld = false;
          return;
        }
        const shouldChargeTrap = Boolean(
          cpu.charging || cpu.cpuHoldChargeTrap ||
          matchingFlyCount <= 0 || cpu.score >= opponent.score || selfBonkTrapOpportunity > 0.78
        );
        game.pvpCpuPlan = { waitForSelfBonk: true, holdChargeTrap: shouldChargeTrap, power: 1, releaseTolerance: 0.01 };
        game.pvpCpuDecisionTimer = 0.08;
        if (shouldChargeTrap) {
          cpu.cpuHoldChargeTrap = true;
          if (!cpu.charging) {
            pressPvpButton(cpu.index, "cpu");
          } else {
            cpu.inputHeld = true;
          }
        } else {
          cpu.cpuHoldChargeTrap = false;
          // A plan change must release a started charge, never abandon it in
          // the charging state without a matching virtual keyup.
          if (cpu.charging) releasePvpButton(cpu.index, "cpu");
          else cpu.inputHeld = false;
        }
        return;
      }
      cpu.cpuTrapIdleTime = 0;
      if (cpu.cpuHoldChargeTrap) {
        // Once the lower frog leaves the trap, release the meter at its current
        // oscillating charge instead of cancelling the held input.
        cpu.cpuHoldChargeTrap = false;
        if (cpu.charging) {
          releasePvpButton(cpu.index, "cpu");
          game.pvpCpuPlan = null;
          game.pvpCpuDecisionTimer = 0.08;
          return;
        }
      }
      const immediateBonkThreat = getPvpCpuBonkThreat(cpu, opponent);
      const minimumEvasionChargeTime = STEP * 10;
      if (immediateBonkThreat > 0.18) {
        const cpuCenter = cpu.x + cpu.w / 2;
        const opponentCenter = opponent.x + opponent.w / 2;
        let escapeDirection = cpuCenter <= opponentCenter ? -1 : 1;
        if (escapeDirection < 0 && cpu.x < 42) escapeDirection = 1;
        if (escapeDirection > 0 && cpu.x + cpu.w > W - 42) escapeDirection = -1;
        if (cpu.charging) escapeDirection = cpu.chargeFacingDir >= 0 ? 1 : -1;
        const desiredPower = clamp(0.42 + immediateBonkThreat * 0.48, 0.46, 0.92);
        if (cpu.charging) {
          const reachedEscapePower = cpu.chargeDirection > 0
            ? cpu.charge >= desiredPower
            : cpu.charge <= desiredPower + 0.04;
          if (cpu.chargeHoldTime < minimumEvasionChargeTime || !reachedEscapePower) return;
          if (game.pvpCpuEvasionCooldownFrames <= 0) {
            releasePvpButton(cpu.index, "cpu");
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.06;
            game.pvpCpuEvasionCooldownFrames = 12;
          }
          return;
        }
        if (game.pvpCpuEvasionCooldownFrames > 0) {
          game.pvpCpuDecisionTimer = Math.max(game.pvpCpuDecisionTimer, STEP);
          return;
        }
        game.pvpCpuPlan = { defensiveHop: true, direction: escapeDirection, power: desiredPower, releaseTolerance: 0.035, reactionDelay: 0 };
        if (escapeDirection !== (cpu.dir >= 0 ? 1 : -1)) {
          game.pvpCpuDecisionTimer = 0.08;
          return;
        }
        pressPvpButton(cpu.index, "cpu");
        return;
      }

      if (!cpu.charging) {
        const planTargetAlive = Boolean(
          game.pvpCpuPlan && (
            game.pvpCpuPlan.waitOnElevator ||
            game.pvpCpuPlan.targetFlyId == null ||
            flies.some((fly) => fly.id === game.pvpCpuPlan.targetFlyId && fly.state === "active" && flyMatchesPrompt(fly))
          )
        );
        if (!planTargetAlive) game.pvpCpuPlan = null;
        if (!game.pvpCpuPlan && game.pvpCpuDecisionTimer <= 0) {
          game.pvpCpuPlan = choosePvpCpuPlan(cpu);
          game.pvpCpuDecisionTimer = game.pvpCpuPlan
            ? (immediateBonkThreat > 0.18 ? 0 : (cpu.firstJumpMade ? game.pvpCpuPlan.reactionDelay : 0))
            : 0.05;
        }
        if (game.pvpCpuPlan && game.pvpCpuDecisionTimer <= 0) {
          if (game.pvpCpuPlan.waitForSelfBonk) {
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.08;
            return;
          }
          if (game.pvpCpuPlan.waitOnElevator) {
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.08;
            return;
          }
          if (game.pvpCpuPlan.defensiveHop && game.pvpCpuEvasionCooldownFrames > 0) return;
          if (Number.isFinite(game.pvpCpuPlan.targetFlyId)) {
            const plannedFly = flies.find((fly) => fly.id === game.pvpCpuPlan.targetFlyId && fly.state === "active");
            if (plannedFly) registerPvpFlyPursuit(cpu, plannedFly);
          }
          const rawPlanDirection = Number(game.pvpCpuPlan.direction);
          const planDirection = rawPlanDirection < 0 ? -1 : rawPlanDirection > 0 ? 1 : (cpu.dir >= 0 ? 1 : -1);
          if (planDirection !== (cpu.dir >= 0 ? 1 : -1)) {
            game.pvpCpuPlan = null;
            game.pvpCpuDecisionTimer = 0.08;
            return;
          }
          pressPvpButton(cpu.index, "cpu");
        }
        return;
      }

      const plan = game.pvpCpuPlan;
      if (!plan) {
        if (cpu.cpuHoldChargeTrap) return;
        releasePvpButton(cpu.index, "cpu");
        return;
      }
      if (plan.holdChargeTrap || cpu.cpuHoldChargeTrap) {
        cpu.cpuHoldChargeTrap = true;
        cpu.inputHeld = true;
        return;
      }
      if (plan.defensiveHop && cpu.chargeHoldTime < minimumEvasionChargeTime) return;
      const reachedCharge = cpu.chargeDirection > 0
        ? cpu.charge >= plan.power - plan.releaseTolerance
        : cpu.charge <= plan.power + plan.releaseTolerance;
      const overheld = cpu.chargeHoldTime >= lerp(0.58, 1.18, clamp((game.pvpCpuDifficulty || 1) / 9, 0, 1));
      if (reachedCharge || overheld) {
        releasePvpButton(cpu.index, "cpu");
        if (plan.defensiveHop) game.pvpCpuEvasionCooldownFrames = 10;
        game.pvpCpuPlan = null;
        game.pvpCpuDecisionTimer = lerp(0.34, 0.05, clamp((game.pvpCpuDifficulty || 1) / 9, 0, 1));
      }
    }
