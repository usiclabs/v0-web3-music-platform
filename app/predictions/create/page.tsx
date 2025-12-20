... existing code at end of file ...

              {/* Step 4: Outcome & Resolution */}
              {currentStep === 4 && (
                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold">Outcome & Resolution</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Set the resolution criteria and timeline
                        </p>
                      </div>
                    </div>

                    {/* ... remaining form fields ... */}

                    {/* <CHANGE> Added risk assessment before market creation */}
                    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-6">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-accent/10 p-2 shrink-0">
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">Market Quality Check</p>
                          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>Clear resolution criteria</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>Objective verification source</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>Reasonable resolution timeline</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !validateStep(4)}
                      className="w-full h-11 sm:h-12 text-base font-semibold"
                      size="lg"
                    >
                      {loading ? "Creating Market..." : "Create Market"}
                    </Button>
                  </Card>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
