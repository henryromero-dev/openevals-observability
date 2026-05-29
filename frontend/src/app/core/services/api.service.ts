import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  Persona, CreatePersonaPayload, UpdatePersonaPayload,
  Evaluator, CreateEvaluatorPayload, UpdateEvaluatorPayload,
  Simulation, CreateSimulationPayload,
  ChatResponse,
  RunSummary, RunDetail, ReportStats,
} from '../models/api.models';

const BASE = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ── Graph ──────────────────────────────────────────────────────────────────

  chat(message: string, threadId?: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${BASE}/graph/chat`, { message, threadId });
  }

  // ── Personas ───────────────────────────────────────────────────────────────

  getPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${BASE}/personas`);
  }

  getPersona(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${BASE}/personas/${id}`);
  }

  createPersona(payload: CreatePersonaPayload): Observable<Persona> {
    return this.http.post<Persona>(`${BASE}/personas`, payload);
  }

  updatePersona(id: number, payload: UpdatePersonaPayload): Observable<Persona> {
    return this.http.patch<Persona>(`${BASE}/personas/${id}`, payload);
  }

  deletePersona(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/personas/${id}`);
  }

  // ── Evaluators ─────────────────────────────────────────────────────────────

  getEvaluators(): Observable<Evaluator[]> {
    return this.http.get<Evaluator[]>(`${BASE}/evaluators`);
  }

  getEvaluator(id: number): Observable<Evaluator> {
    return this.http.get<Evaluator>(`${BASE}/evaluators/${id}`);
  }

  createEvaluator(payload: CreateEvaluatorPayload): Observable<Evaluator> {
    return this.http.post<Evaluator>(`${BASE}/evaluators`, payload);
  }

  updateEvaluator(id: number, payload: UpdateEvaluatorPayload): Observable<Evaluator> {
    return this.http.patch<Evaluator>(`${BASE}/evaluators/${id}`, payload);
  }

  deleteEvaluator(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/evaluators/${id}`);
  }

  // ── Simulations ────────────────────────────────────────────────────────────

  getSimulations(): Observable<Simulation[]> {
    return this.http.get<Simulation[]>(`${BASE}/simulations`);
  }

  getSimulation(id: number): Observable<Simulation> {
    return this.http.get<Simulation>(`${BASE}/simulations/${id}`);
  }

  createSimulation(payload: CreateSimulationPayload): Observable<Simulation> {
    return this.http.post<Simulation>(`${BASE}/simulations`, payload);
  }

  deleteSimulation(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/simulations/${id}`);
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  getReportStats(): Observable<ReportStats> {
    return this.http.get<ReportStats>(`${BASE}/reports/stats`);
  }

  getRuns(limit = 50): Observable<RunSummary[]> {
    return this.http.get<RunSummary[]>(`${BASE}/reports/runs?limit=${limit}`);
  }

  getRunDetail(id: string): Observable<RunDetail> {
    return this.http.get<RunDetail>(`${BASE}/reports/runs/${id}`);
  }

  getRunsByThread(threadId: string): Observable<RunSummary[]> {
    return this.http.get<RunSummary[]>(`${BASE}/reports/runs/by-thread/${encodeURIComponent(threadId)}`);
  }
}
